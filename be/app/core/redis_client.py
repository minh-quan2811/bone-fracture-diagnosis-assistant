import redis
from app.core.config import settings

# Single shared connection pool for the whole process (FastAPI workers and
# Celery workers each get their own pool per-process, which is the correct
# pattern for redis-py).
redis_pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)


def get_redis_client() -> redis.Redis:
    """Return a Redis client bound to the shared connection pool."""
    return redis.Redis(connection_pool=redis_pool)