from langchain_google_genai import ChatGoogleGenerativeAI
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from app.core.config import settings

class StudentChatbot:
    """Simple stateless chatbot for medical education"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            google_api_key=settings.GEMINI_API_KEY
        )
        
        self.system_prompt = """
        You are a helpful medical AI assistant specializing in bone fractures and orthopedic education. 
        You help students learn about:
        - Different types of bone fractures (greenstick, transverse, comminuted, spiral, compound, oblique, compression, avulsion, hairline)
        - Fracture detection and diagnosis
        - Treatment options
        - Anatomy and healing processes

        Provide clear, educational responses appropriate for medical students.
        """
    
    def run(self, user_message: str) -> str:
        """
        Generate a response to user message
        """
        full_prompt = f"{self.system_prompt}\n\nUser: {user_message}\n\nAssistant:"
        
        try:
            response = self.llm.invoke(full_prompt)
            return response.content
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."

chatbot = StudentChatbot()

# if __name__ == "__main__":
#     print("=" * 60)
    
#     # Test questions
#     test_questions = [
#         "What is a greenstick fracture?",
#         "How do you treat a transverse fracture?",
#     ]
    
#     for i, question in enumerate(test_questions, 1):
#         print(f"Question {i}: {question}")
#         print("-" * 60)
        
#         try:
#             response = chatbot.run(question)
#             print(f"Response: {response}")
#         except Exception as e:
#             print(f"Error: {str(e)}")