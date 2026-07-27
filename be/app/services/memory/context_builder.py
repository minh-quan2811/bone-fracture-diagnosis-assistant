from dataclasses import dataclass
from typing import List

from sqlalchemy.orm import Session

from app.services.memory.redis_buffer import RedisBuffer
from app.services.memory.summary_store import summary_store
from app.utils.token_utils import count_tokens


@dataclass
class MemoryContext:
    summary_text: str
    raw_messages: List[dict]
    formatted_block: str
    total_tokens: int


class ContextBuilder:
    def __init__(self, redis_buffer: RedisBuffer = None):
        self.redis_buffer = redis_buffer or RedisBuffer()

    def build(self, db: Session, user_id: int, conversation_id: int) -> MemoryContext:
        summary_row = summary_store.get(db, conversation_id)
        summary_text = summary_row.summary_text if summary_row else ""

        raw_messages = self.redis_buffer.get_messages(user_id, conversation_id)

        sections = []
        if summary_text:
            sections.append(f"[Session Summary]\n{summary_text}")

        if raw_messages:
            transcript = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
                for m in raw_messages
            )
            sections.append(f"[Recent Conversation]\n{transcript}")

        formatted_block = "\n\n".join(sections)

        total_tokens = count_tokens(summary_text) + sum(m["token_count"] for m in raw_messages)

        return MemoryContext(
            summary_text=summary_text,
            raw_messages=raw_messages,
            formatted_block=formatted_block,
            total_tokens=total_tokens,
        )


context_builder = ContextBuilder()