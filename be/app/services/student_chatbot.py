import os
import logging
from typing import List, Optional, TypedDict

from langsmith import traceable
from langgraph.graph import StateGraph, START, END

from app.core.config import settings
from app.core.model_manager import model_manager
from app.services.rag_service import VectorRetrievalManager

from app.services.prompts.student_chatbot_prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

os.environ["LANGSMITH_TRACING"] = settings.LANGSMITH_TRACING
os.environ["LANGSMITH_API_KEY"] = settings.LANGSMITH_API_KEY
os.environ["LANGSMITH_PROJECT"] = settings.LANGSMITH_PROJECT


class AgentState(TypedDict):
    question: str
    memory_context: Optional[str]
    retrieved_nodes: List[object]
    context: str
    answer: str
    error: Optional[str]


class StudentChatbot:

    def __init__(
            self,
            collection_name: str = "medical_documents",
            index_id: str = "medical_doc_index",
            dense_top_k: int = 30,
            sparse_top_k: int = 30,
            rrf_k: int = 60,
            final_top_k: int = 20,
            auto_merge_threshold: float = 0.5,
        ):
            self.llm = model_manager.get_llm_langchain_instance()
            self.retrieval_manager = VectorRetrievalManager(
                collection_name=collection_name,
                index_id=index_id,
            )

            self.dense_top_k = dense_top_k
            self.sparse_top_k = sparse_top_k
            self.rrf_k = rrf_k
            self.final_top_k = final_top_k
            self.auto_merge_threshold = auto_merge_threshold

            self.graph = self._build_graph()
            logger.info("StudentChatbot (LangGraph) initialized")

    @traceable(name="retrieve_context", run_type="retriever")
    def _retrieve_node(self, state: AgentState) -> dict:
        question = state["question"]
        try:
            nodes = self.retrieval_manager.retrieve_hybrid(
                question,
                dense_top_k=self.dense_top_k,
                sparse_top_k=self.sparse_top_k,
                rrf_k=self.rrf_k,
                final_top_k=self.final_top_k,
                auto_merge_threshold=self.auto_merge_threshold,
            )
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            return {"retrieved_nodes": [], "context": "", "error": f"Retrieval failed: {e}"}

        context = self._format_context(nodes)
        return {"retrieved_nodes": nodes, "context": context, "error": None}

    @traceable(name="generate_answer", run_type="chain")
    def _generate_node(self, state: AgentState) -> dict:
        if state.get("error"):
            return {"answer": f"I ran into an issue retrieving information: {state['error']}. Please try again."}

        question = state["question"]
        context = state["context"]
        memory_context = state.get("memory_context")

        context_block = context if context.strip() else "No relevant documents were found in the knowledge base for this question."
        memory_block = f"{memory_context}\n\n" if memory_context else ""

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"{memory_block}"
            f"Retrieved Context:\n{context_block}\n\n"
            f"Student Question: {question}\n\n"
            f"Answer:"
        )

        try:
            response = self._invoke_llm(prompt)
            answer = response.content if hasattr(response, "content") else str(response)
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            answer = f"I apologize, but I encountered an error generating a response: {e}. Please try again."

        return {"answer": answer}

    @traceable(name="llm_call", run_type="llm")
    def _invoke_llm(self, prompt: str):
        return self.llm.invoke(prompt)

    @staticmethod
    def _format_context(nodes: List[object]) -> str:
        if not nodes:
            return ""

        chunks = []
        for i, node_with_score in enumerate(nodes, start=1):
            node = getattr(node_with_score, "node", node_with_score)
            text = node.get_content() if hasattr(node, "get_content") else str(node)
            metadata = getattr(node, "metadata", {}) or {}
            source = metadata.get("file_name") or metadata.get("file_path") or "unknown source"
            score = getattr(node_with_score, "score", None)
            score_str = f", relevance: {score:.2f}" if isinstance(score, float) else ""
            chunks.append(f"[Chunk {i} | Source: {source}{score_str}]\n{text}")

        return "\n\n---\n\n".join(chunks)

    def _build_graph(self):
        builder = StateGraph(AgentState)
        builder.add_node("retrieve", self._retrieve_node)
        builder.add_node("generate", self._generate_node)
        builder.add_edge(START, "retrieve")
        builder.add_edge("retrieve", "generate")
        builder.add_edge("generate", END)
        return builder.compile()

    def run(self, user_message: str, memory_context: Optional[str] = None) -> str:
        initial_state: AgentState = {
            "question": user_message,
            "memory_context": memory_context,
            "retrieved_nodes": [],
            "context": "",
            "answer": "",
            "error": None,
        }

        config = {
            "run_name": "student_chatbot_query",
            "tags": ["student-chatbot", "rag"],
            "metadata": {"question_preview": user_message[:100]},
        }

        try:
            final_state = self.graph.invoke(initial_state, config=config)
            return final_state["answer"]
        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."


chatbot = StudentChatbot()