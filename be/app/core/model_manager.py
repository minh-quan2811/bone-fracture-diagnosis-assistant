from langchain_google_genai import ChatGoogleGenerativeAI
from llama_index.embeddings.cohere import CohereEmbedding
from llama_index.postprocessor.cohere_rerank import CohereRerank
from app.core.config import settings

class ModelManager:
    def __init__(self):
        pass

    def get_embedding_instance(self):
        """
        Get Cohere embedding model instance.
        """
        return CohereEmbedding(
            api_key=settings.COHERE_API_KEY,
            model_name="embed-english-v3.0",
            max_tokens=60000
        )

    def get_llm_langchain_instance(self):
        """
        Get LangChain LLM instance (Google Gemini).
        """
        return ChatGoogleGenerativeAI(
            google_api_key=settings.GEMINI_API_KEY,
            model="gemini-2.0-flash",
            temperature=0.7
        )

    def get_model_rerank(self):
        """
        Get Cohere rerank model instance.
        """
        return CohereRerank(
            api_key=settings.COHERE_API_KEY,
            top_n=3,
            model="rerank-multilingual-v3.0"
        )

model_manager = ModelManager()