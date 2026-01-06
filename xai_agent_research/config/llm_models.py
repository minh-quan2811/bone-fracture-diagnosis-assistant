from langchain_google_genai import ChatGoogleGenerativeAI
from .constant_path import APIConfig

class LLMModelManager:
    def __init__(self):
        pass

    def get_llm_instance(self):
        return ChatGoogleGenerativeAI(
            google_api_key=str(APIConfig.GEMINI_API_KEY),
            model="gemini-2.5-flash",
            temperature=0.7
        )

llm_manager = LLMModelManager()

print(APIConfig.GEMINI_API_KEY)