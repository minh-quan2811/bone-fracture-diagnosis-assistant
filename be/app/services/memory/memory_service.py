import logging

from sqlalchemy.orm import Session

from app.core.memory_config import (
    MEMORY_SUMMARIZE_OLDEST_RATIO,
    MEMORY_SUMMARY_TOKEN_LIMIT,
)
from app.services.memory.compressor import compress_reply, enforce_summary_limit, merge_and_summarize
from app.services.memory.redis_buffer import RedisBuffer
from app.services.memory.summary_store import summary_store
from app.utils.token_utils import count_tokens

logger = logging.getLogger(__name__)


class MemoryService:
    def __init__(self, redis_buffer: RedisBuffer = None):
        self.redis_buffer = redis_buffer or RedisBuffer()

    def record_turn(self, user_id: int, conversation_id: int, user_message: str, full_agent_reply: str) -> bool:
        """Record user message and compressed agent reply to Redis buffer."""
        self.redis_buffer.add_message(user_id, conversation_id, role="user", content=user_message)

        compressed_reply = compress_reply(full_agent_reply)
        self.redis_buffer.add_message(
            user_id, conversation_id, role="assistant", content=compressed_reply, skip_filler_check=True
        )

        if self.redis_buffer.is_over_budget(user_id, conversation_id):
            return self._enqueue_summarization(user_id, conversation_id)
        return False

    def _enqueue_summarization(self, user_id: int, conversation_id: int) -> bool:
        # Avoid circular import with memory_tasks
        from app.tasks.memory_tasks import summarize_session

        summarize_session.delay(user_id, conversation_id)
        return True

    def run_summarization(self, db: Session, user_id: int, conversation_id: int) -> bool:
        """Execute one summarization cycle guarded by Redis lock."""
        if not self.redis_buffer.acquire_summarization_lock(user_id, conversation_id):
            logger.info("Summarization already in progress for %s:%s, skipping", user_id, conversation_id)
            return False

        try:
            batch = self.redis_buffer.oldest_by_token_ratio(
                user_id, conversation_id, MEMORY_SUMMARIZE_OLDEST_RATIO
            )
            if not batch:
                return False

            existing_row = summary_store.get(db, conversation_id)
            existing_summary = existing_row.summary_text if existing_row else ""

            new_messages_text = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}" for m in batch
            )

            updated_summary = merge_and_summarize(
                existing_summary, new_messages_text, MEMORY_SUMMARY_TOKEN_LIMIT
            )
            updated_summary = enforce_summary_limit(updated_summary, MEMORY_SUMMARY_TOKEN_LIMIT)

            summary_store.upsert(
                db,
                user_id=user_id,
                conversation_id=conversation_id,
                summary_text=updated_summary,
                token_count=count_tokens(updated_summary),
            )

            summarized_ids = {m["id"] for m in batch}
            self.redis_buffer.remove_messages(user_id, conversation_id, summarized_ids)

            return True
        finally:
            self.redis_buffer.release_summarization_lock(user_id, conversation_id)


memory_service = MemoryService()