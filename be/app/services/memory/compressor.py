import logging

from app.core.model_manager import model_manager
from app.services.prompts.memory_prompts import (
    COMPRESS_REPLY_PROMPT,
    MERGE_SUMMARY_PROMPT,
    COMPRESS_SUMMARY_PROMPT,
)
from app.utils.token_utils import count_tokens

logger = logging.getLogger(__name__)


def _invoke(prompt: str) -> str:
    llm = model_manager.get_summarization_llm()
    response = llm.invoke(prompt)
    text = response.content if hasattr(response, "content") else str(response)
    return text.strip()


def compress_reply(full_reply: str, fallback_sentence_count: int = 2) -> str:
    """Compress full agent reply to 1-2 sentences, fallback to truncation on error."""
    try:
        return _invoke(COMPRESS_REPLY_PROMPT.format(reply=full_reply))
    except Exception as e:
        logger.warning("compress_reply LLM call failed, falling back to truncation: %s", e)
        sentences = full_reply.strip().split(". ")
        return ". ".join(sentences[:fallback_sentence_count]).strip()[:300]


def merge_and_summarize(existing_summary: str, new_messages_text: str, max_tokens: int) -> str:
    prompt = MERGE_SUMMARY_PROMPT.format(
        existing_summary=existing_summary or "(none yet)",
        new_messages=new_messages_text,
        max_tokens=max_tokens,
    )
    return _invoke(prompt)


def enforce_summary_limit(summary: str, max_tokens: int) -> str:
    """Compress summary if it exceeds max_tokens, otherwise return as-is."""
    if count_tokens(summary) <= max_tokens:
        return summary
    try:
        return _invoke(COMPRESS_SUMMARY_PROMPT.format(summary=summary, max_tokens=max_tokens))
    except Exception as e:
        logger.warning("enforce_summary_limit LLM call failed, hard-truncating: %s", e)
        return summary[: max_tokens * 4]