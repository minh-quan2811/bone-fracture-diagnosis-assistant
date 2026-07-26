"""
Orchestrates writes into the two-buffer memory system. Kept as plain,
directly-callable logic (no Celery decorators here) so it's easy to test;
app/tasks/memory_tasks.py wraps these as background Celery tasks, matching
the pattern used for document/fracture processing elsewhere in this repo.
"""
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.memory.compressor import compress_reply, enforce_summary_limit, merge_and_summarize
from app.services.memory.redis_buffer import RedisBuffer
from app.services.memory.summary_store import summary_store
from app.utils.token_utils import count_tokens

logger = logging.getLogger(__name__)


class MemoryService:
    def __init__(self, redis_buffer: RedisBuffer = None):
        self.redis_buffer = redis_buffer or RedisBuffer()

    # -- turn recording (runs in the background, off the request path) ----

    def record_turn(self, user_id: int, conversation_id: int, user_message: str, full_agent_reply: str) -> bool:
        """
        Write the user's message and a compressed version of the agent's
        reply into the Redis buffer. Returns True if a summarization
        trigger was enqueued as a result of this write.

        The FULL agent reply is what's already been returned to the user
        by the request path before this ever runs — only the compressed
        version enters Redis.
        """
        self.redis_buffer.add_message(user_id, conversation_id, role="user", content=user_message)

        compressed_reply = compress_reply(full_agent_reply)
        self.redis_buffer.add_message(
            user_id, conversation_id, role="assistant", content=compressed_reply, skip_filler_check=True
        )

        if self.redis_buffer.is_over_budget(user_id, conversation_id):
            return self._enqueue_summarization(user_id, conversation_id)
        return False

    def _enqueue_summarization(self, user_id: int, conversation_id: int) -> bool:
        # Imported here to avoid a circular import (memory_tasks imports
        # this module to call run_summarization).
        from app.tasks.memory_tasks import summarize_session

        summarize_session.delay(user_id, conversation_id)
        return True

    # -- summarization cycle (runs inside the Celery task) -----------------

    def run_summarization(self, db: Session, user_id: int, conversation_id: int) -> bool:
        """
        Executes one summarization cycle. Guarded by a Redis lock so two
        concurrent triggers for the same session don't both run. Returns
        True if a summary was written, False if skipped (e.g. lock held,
        or nothing to summarize).
        """
        if not self.redis_buffer.acquire_summarization_lock(user_id, conversation_id):
            logger.info("Summarization already in progress for %s:%s, skipping", user_id, conversation_id)
            return False

        try:
            batch = self.redis_buffer.oldest_by_token_ratio(
                user_id, conversation_id, settings.MEMORY_SUMMARIZE_OLDEST_RATIO
            )
            if not batch:
                return False

            existing_row = summary_store.get(db, conversation_id)
            existing_summary = existing_row.summary_text if existing_row else ""

            new_messages_text = "\n".join(
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}" for m in batch
            )

            updated_summary = merge_and_summarize(
                existing_summary, new_messages_text, settings.MEMORY_SUMMARY_TOKEN_LIMIT
            )
            updated_summary = enforce_summary_limit(updated_summary, settings.MEMORY_SUMMARY_TOKEN_LIMIT)

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