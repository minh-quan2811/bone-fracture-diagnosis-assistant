"""
LLM-backed compression used by the memory system:
  - compress_reply: squeeze a full agent reply into 1-2 sentences before
    it enters the Redis raw buffer ("eager compression").
  - merge_and_summarize: combine the existing Postgres summary with a
    batch of oldest Redis messages into an updated summary.
  - enforce_summary_limit: a second compression pass if a summary comes
    back over the token cap.
"""
import logging

from app.core.model_manager import model_manager
from app.utils.token_utils import count_tokens

logger = logging.getLogger(__name__)

_COMPRESS_REPLY_PROMPT = """Compress the following AI assistant reply into 1-2 short sentences \
that capture only the key point or action taken. Do not add commentary, do not use quotes, \
output only the compressed sentence(s).

Reply:
{reply}

Compressed:"""

_MERGE_SUMMARY_PROMPT = """You are maintaining a running summary of a conversation between a \
student and a medical education assistant, for the assistant's own memory.

Existing summary (may be empty if this is the first cycle):
{existing_summary}

New messages to fold in (chronological):
{new_messages}

Write an updated summary that merges the existing summary with the new messages. \
Keep it factual and dense — key topics discussed, decisions/recommendations given, open \
questions. Target under {max_tokens} tokens. Output only the summary text, no preamble."""

_COMPRESS_SUMMARY_PROMPT = """The following summary is too long. Compress it to under \
{max_tokens} tokens while preserving all key facts, decisions, and open threads. \
Output only the compressed summary, no preamble.

Summary:
{summary}

Compressed:"""


def _invoke(prompt: str) -> str:
    llm = model_manager.get_summarization_llm()
    response = llm.invoke(prompt)
    text = response.content if hasattr(response, "content") else str(response)
    return text.strip()


def compress_reply(full_reply: str, fallback_sentence_count: int = 2) -> str:
    """
    Compress a full agent reply to 1-2 sentences for Redis storage.
    Falls back to a naive truncation if the LLM call fails, so a
    transient API error never blocks the write path.
    """
    try:
        return _invoke(_COMPRESS_REPLY_PROMPT.format(reply=full_reply))
    except Exception as e:
        logger.warning("compress_reply LLM call failed, falling back to truncation: %s", e)
        sentences = full_reply.strip().split(". ")
        return ". ".join(sentences[:fallback_sentence_count]).strip()[:300]


def merge_and_summarize(existing_summary: str, new_messages_text: str, max_tokens: int) -> str:
    prompt = _MERGE_SUMMARY_PROMPT.format(
        existing_summary=existing_summary or "(none yet)",
        new_messages=new_messages_text,
        max_tokens=max_tokens,
    )
    return _invoke(prompt)


def enforce_summary_limit(summary: str, max_tokens: int) -> str:
    """If `summary` exceeds max_tokens, run a second compression pass."""
    if count_tokens(summary) <= max_tokens:
        return summary
    try:
        return _invoke(_COMPRESS_SUMMARY_PROMPT.format(summary=summary, max_tokens=max_tokens))
    except Exception as e:
        logger.warning("enforce_summary_limit LLM call failed, hard-truncating: %s", e)
        # Last-resort safety net: hard character truncation so the DB
        # column never grows unbounded even if the LLM is unreachable.
        return summary[: max_tokens * 4]