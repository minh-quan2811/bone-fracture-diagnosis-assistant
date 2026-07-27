COMPRESS_REPLY_PROMPT = """Compress the following AI assistant reply into 1-2 short sentences \
that capture only the key point or action taken. Do not add commentary, do not use quotes, \
output only the compressed sentence(s).

Reply:
{reply}

Compressed:"""

MERGE_SUMMARY_PROMPT = """You are maintaining a running summary of a conversation between a \
student and a medical education assistant, for the assistant's own memory.

Existing summary (may be empty if this is the first cycle):
{existing_summary}

New messages to fold in (chronological):
{new_messages}

Write an updated summary that merges the existing summary with the new messages. \
Keep it factual and dense — key topics discussed, decisions/recommendations given, open \
questions. Target under {max_tokens} tokens. Output only the summary text, no preamble."""

COMPRESS_SUMMARY_PROMPT = """The following summary is too long. Compress it to under \
{max_tokens} tokens while preserving all key facts, decisions, and open threads. \
Output only the compressed summary, no preamble.

Summary:
{summary}

Compressed:"""
