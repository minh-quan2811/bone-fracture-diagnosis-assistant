"""
Manual test script for StudentChatbot.

Usage:
    # from the be/ directory
    python -m tests.manual_test_chatbot            # run built-in sample questions (no memory)
    python -m tests.manual_test_chatbot --chat      # interactive Q&A loop, backed by the two-buffer memory system
"""
import argparse
import sys

from app.core.database import SessionLocal
from app.core.config import settings
from app.enums.roles import RoleEnum
from app.models.user import User
from app.models.conversation import Conversation
from app.models.session_summary import SessionSummary
from app.services.student_chatbot import chatbot
from app.services.memory.context_builder import context_builder
from app.services.memory.redis_buffer import RedisBuffer
from app.services.memory.summary_store import summary_store
from app.tasks.memory_tasks import record_turn as record_turn_task

from celery_app import celery_app
celery_app.conf.task_always_eager = True
celery_app.conf.task_eager_propagates = True


SAMPLE_QUESTIONS = [
    "What is a greenstick fracture?",
    "How do you differentiate a spiral fracture from an oblique fracture?",
    "What is the capital of France?",  # expected: out-of-scope
]

TEST_USERNAME = "manual_test_chatbot"
TEST_EMAIL = "manual_test_chatbot@example.com"
TEST_CONVERSATION_TITLE = "manual_test_chatbot session"


def _get_or_create_test_session(db):
    """Get (or create, on first run) a dedicated user + conversation used
    only by this script, so --chat has a real session to write memory
    against."""
    user = db.query(User).filter(User.username == TEST_USERNAME).first()
    if not user:
        user = User(
            username=TEST_USERNAME,
            email=TEST_EMAIL,
            hashed_password="manual-test-not-a-real-password",
            role=RoleEnum.STUDENT,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    conversation = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id, Conversation.title == TEST_CONVERSATION_TITLE)
        .first()
    )
    if not conversation:
        conversation = Conversation(title=TEST_CONVERSATION_TITLE, user_id=user.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    return user.id, conversation.id


def _print_memory_diagnostics(db, user_id, conversation_id):
    buffer = RedisBuffer()
    messages = buffer.get_messages(user_id, conversation_id)
    token_total = sum(m["token_count"] for m in messages)
    summary_row = summary_store.get(db, conversation_id)
    summary_state = f"{summary_row.token_count} tok" if summary_row else "none yet"
    print(
        f"[memory] redis: {len(messages)} msg(s), {token_total}/{settings.MEMORY_REDIS_TOKEN_BUDGET} tok"
        f" | postgres summary: {summary_state}"
    )


def _reset_memory(db, user_id, conversation_id):
    buffer = RedisBuffer()
    buffer.client.delete(buffer._key(user_id, conversation_id))
    db.query(SessionSummary).filter(SessionSummary.conversation_id == conversation_id).delete()
    db.commit()
    print("[memory] cleared Redis buffer and Postgres summary for this test session.\n")


def run_single(question: str, db=None, user_id=None, conversation_id=None):
    print("=" * 80)
    print(f"Q: {question}")
    print("-" * 80)

    memory_context = None
    if db is not None and user_id is not None and conversation_id is not None:
        memory = context_builder.build(db, user_id, conversation_id)
        memory_context = memory.formatted_block or None
        if memory_context:
            preview = memory_context[:300] + ("..." if len(memory_context) > 300 else "")
            print("[memory] context injected into prompt:")
            print(preview)
            print("-" * 80)

    initial_state = {
        "question": question,
        "memory_context": memory_context,
        "retrieved_nodes": [],
        "context": "",
        "answer": "",
        "error": None,
    }
    final_state = chatbot.graph.invoke(initial_state)

    nodes = final_state.get("retrieved_nodes", [])
    print(f"Retrieved {len(nodes)} chunk(s)")
    for i, n in enumerate(nodes, start=1):
        node = getattr(n, "node", n)
        metadata = getattr(node, "metadata", {}) or {}
        source = metadata.get("file_name") or metadata.get("file_path") or "unknown source"
        score = getattr(n, "score", None)
        preview = node.get_content()[:100].replace("\n", " ") if hasattr(node, "get_content") else ""
        print(f"  [{i}] source={source} score={score} preview={preview!r}")

    if final_state.get("error"):
        print(f"Error: {final_state['error']}")

    answer = final_state.get("answer")
    print("-" * 80)
    print(f"A: {answer}")
    print("=" * 80)
    print()

    if db is not None and user_id is not None and conversation_id is not None:
        record_turn_task(user_id, conversation_id, question, answer)
        _print_memory_diagnostics(db, user_id, conversation_id)
        print()

    return final_state


def run_samples():
    for q in SAMPLE_QUESTIONS:
        run_single(q)


def run_interactive():
    db = SessionLocal()
    try:
        user_id, conversation_id = _get_or_create_test_session(db)
        print("Interactive chatbot test, backed by the memory system.")
        print(f"[memory] test session -> user_id={user_id} conversation_id={conversation_id}")
        print("Type 'exit'/'quit' to stop, 'reset' to clear this session's memory.\n")

        while True:
            try:
                question = input("You: ").strip()
            except (EOFError, KeyboardInterrupt):
                break

            if not question:
                continue
            if question.lower() in ("exit", "quit"):
                break
            if question.lower() == "reset":
                _reset_memory(db, user_id, conversation_id)
                continue

            run_single(question, db=db, user_id=user_id, conversation_id=conversation_id)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manually test the StudentChatbot LangGraph agent")
    parser.add_argument("--chat", action="store_true", help="Run an interactive Q&A loop instead of sample questions")
    args = parser.parse_args()

    if args.chat:
        run_interactive()
    else:
        run_samples()

    sys.exit(0)