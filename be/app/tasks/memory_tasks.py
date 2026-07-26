from celery_app import celery_app
from app.core.database import SessionLocal
from app.services.memory.memory_service import memory_service


@celery_app.task(name='app.tasks.memory_tasks.record_turn')
def record_turn(user_id: int, conversation_id: int, user_message: str, full_agent_reply: str):
    """
    Background write into the Redis raw buffer: the user's message plus a
    compressed version of the agent's reply. Runs after the HTTP response
    has already been sent (the full reply was returned to the user by the
    request path) so the compression LLM call never adds latency to a
    turn. May itself enqueue `summarize_session` if the write pushes the
    buffer over its token budget.
    """
    try:
        triggered = memory_service.record_turn(user_id, conversation_id, user_message, full_agent_reply)
        return {"status": "success", "summarization_triggered": triggered}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@celery_app.task(name='app.tasks.memory_tasks.summarize_session')
def summarize_session(user_id: int, conversation_id: int):
    """
    Compress the oldest ~60% (by tokens) of the Redis raw buffer into the
    Postgres session summary, then trim those messages out of Redis.
    Guarded by a Redis lock (see RedisBuffer.acquire_summarization_lock)
    so concurrent triggers for the same session don't double-run.
    """
    db = SessionLocal()
    try:
        summarized = memory_service.run_summarization(db, user_id, conversation_id)
        return {"status": "success", "summarized": summarized}
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()