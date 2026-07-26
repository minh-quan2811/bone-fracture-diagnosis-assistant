"""
Manual test script for StudentChatbot.

Usage:
    # from the be/ directory
    python -m tests.manual_test_chatbot            # run built-in sample questions
    python -m tests.manual_test_chatbot --chat      # interactive Q&A loop
"""
import argparse
import sys

from app.services.student_chatbot import chatbot


SAMPLE_QUESTIONS = [
    "What is a greenstick fracture?",
    "How do you differentiate a spiral fracture from an oblique fracture?",
    "What is the capital of France?",  # expected: out-of-scope
]


def run_single(question: str):
    print("=" * 80)
    print(f"Q: {question}")
    print("-" * 80)

    initial_state = {
        "question": question,
        "chat_history": None,
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

    print("-" * 80)
    print(f"A: {final_state.get('answer')}")
    print("=" * 80)
    print()


def run_samples():
    for q in SAMPLE_QUESTIONS:
        run_single(q)


def run_interactive():
    print("Interactive chatbot test. Type 'exit' or 'quit' to stop.\n")
    while True:
        try:
            question = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if not question:
            continue
        if question.lower() in ("exit", "quit"):
            break

        run_single(question)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manually test the StudentChatbot LangGraph agent")
    parser.add_argument("--chat", action="store_true", help="Run an interactive Q&A loop instead of sample questions")
    args = parser.parse_args()

    if args.chat:
        run_interactive()
    else:
        run_samples()

    sys.exit(0)