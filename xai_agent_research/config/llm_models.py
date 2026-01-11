from langchain_google_genai import ChatGoogleGenerativeAI
from .constant_path import api_config

class LLMModelManager:
    def __init__(self):
        pass

    def get_llm_instance(self):
        return ChatGoogleGenerativeAI(
            google_api_key=str(api_config.GEMINI_API_KEY),
            model="gemini-2.5-flash",
            temperature=0.7
        )

llm_manager = LLMModelManager()