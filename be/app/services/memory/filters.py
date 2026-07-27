from app.core.memory_config import MEMORY_FILLER_MIN_CHARS

# Common short acknowledgements that add no information to the conversation
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
    """Check if message is too short or a common low-information acknowledgement."""
    if content is None:
        return True

    stripped = content.strip()

    if len(stripped) < MEMORY_FILLER_MIN_CHARS:
        return True

    normalized = stripped.lower().rstrip("!.? ")
    if normalized in _FILLER_PHRASES:
        return True

    return False