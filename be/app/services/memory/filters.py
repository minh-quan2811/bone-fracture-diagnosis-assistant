"""
Filters applied before a message is allowed into the Redis raw buffer.

This is intentionally decoupled from anything Postgres/ORM-related: it's a
pure function over text, so it's trivial to unit test and reuse.
"""
from app.core.config import settings

# Common short acknowledgements that add no retrievable information to the
# conversation. Matched case-insensitively against the trimmed message.
_FILLER_PHRASES = {
    "ok", "okay", "k", "kk",
    "thanks", "thank you", "thx", "ty",
    "got it", "got it thanks",
    "sure", "sure thing",
    "cool", "cool thanks",
    "yes", "yep", "yeah", "no", "nope",
    "alright", "understood", "noted",
    "great", "nice", "perfect",
}


def is_filler_message(content: str) -> bool:
    """
    Return True if the message should be DROPPED from the Redis buffer
    entirely (too short, or a common low-information acknowledgement).
    """
    if content is None:
        return True

    stripped = content.strip()

    if len(stripped) < settings.MEMORY_FILLER_MIN_CHARS:
        return True

    normalized = stripped.lower().rstrip("!.? ")
    if normalized in _FILLER_PHRASES:
        return True

    return False