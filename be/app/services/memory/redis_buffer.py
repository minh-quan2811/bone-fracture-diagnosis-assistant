"""
Short-term raw message buffer, stored in Redis.
"""
import json
from datetime import datetime, timezone
from typing import List, Optional, Set
from uuid import uuid4

from redis import Redis

from app.core.config import settings
from app.core.redis_client import get_redis_client
from app.services.memory.filters import is_filler_message
from app.utils.token_utils import count_tokens


class RedisBuffer:
    def __init__(self, client: Optional[Redis] = None):
        self.client = client or get_redis_client()

    @staticmethod
    def _key(user_id: int, conversation_id: int) -> str:
        return f"{user_id}:{conversation_id}"

    @staticmethod
    def _lock_key(user_id: int, conversation_id: int) -> str:
        return f"{user_id}:{conversation_id}:summarizing"

    def add_message(
        self,
        user_id: int,
        conversation_id: int,
        role: str,
        content: str,
        skip_filler_check: bool = False,
    ) -> Optional[dict]:
        """
        Write one message to the buffer. Returns the stored entry, or None
        if the message was dropped as filler.
        """
        if not skip_filler_check and is_filler_message(content):
            return None

        entry = {
            "id": str(uuid4()),
            "role": role,
            "content": content,
            "token_count": count_tokens(content),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        key = self._key(user_id, conversation_id)
        pipe = self.client.pipeline()
        pipe.rpush(key, json.dumps(entry))
        pipe.expire(key, settings.MEMORY_REDIS_TTL_SECONDS)
        pipe.execute()

        return entry

    def get_messages(self, user_id: int, conversation_id: int) -> List[dict]:
        """Chronological list of raw message dicts currently in the buffer."""
        key = self._key(user_id, conversation_id)
        raw = self.client.lrange(key, 0, -1)
        return [json.loads(r) for r in raw]

    def get_token_total(self, user_id: int, conversation_id: int) -> int:
        return sum(m["token_count"] for m in self.get_messages(user_id, conversation_id))

    def is_over_budget(self, user_id: int, conversation_id: int) -> bool:
        return self.get_token_total(user_id, conversation_id) > settings.MEMORY_REDIS_TOKEN_BUDGET

    def remove_messages(self, user_id: int, conversation_id: int, message_ids: Set[str]) -> None:
        """
        Remove specific messages by id (not a positional slice) — the
        buffer may have grown since the summarization job read its
        snapshot, so we must trim exactly what was summarized.
        """
        key = self._key(user_id, conversation_id)
        remaining = [m for m in self.get_messages(user_id, conversation_id) if m["id"] not in message_ids]

        pipe = self.client.pipeline()
        pipe.delete(key)
        if remaining:
            pipe.rpush(key, *[json.dumps(m) for m in remaining])
            pipe.expire(key, settings.MEMORY_REDIS_TTL_SECONDS)
        pipe.execute()

    def oldest_by_token_ratio(self, user_id: int, conversation_id: int, ratio: float) -> List[dict]:
        """
        Walk from the oldest message, accumulating token counts, and
        return the prefix that covers ~`ratio` of the buffer's total
        tokens. Cuts by token weight, not message count, since messages
        vary a lot in size.
        """
        messages = self.get_messages(user_id, conversation_id)
        total = sum(m["token_count"] for m in messages)
        if total == 0:
            return []

        target = total * ratio
        selected, running = [], 0
        for m in messages:
            if running >= target:
                break
            selected.append(m)
            running += m["token_count"]
        return selected

    def acquire_summarization_lock(self, user_id: int, conversation_id: int, ttl_seconds: int = 120) -> bool:
        return bool(
            self.client.set(self._lock_key(user_id, conversation_id), "1", nx=True, ex=ttl_seconds)
        )

    def release_summarization_lock(self, user_id: int, conversation_id: int) -> None:
        self.client.delete(self._lock_key(user_id, conversation_id))