_CHARS_PER_TOKEN = 4


def count_tokens(text: str) -> int:
    """Estimate the token count of a string. Empty/None-safe."""
    if not text:
        return 0
    return max(1, len(text) // _CHARS_PER_TOKEN)