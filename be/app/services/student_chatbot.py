from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings

# Simple chatbot using LangChain with Gemini
def get_chatbot():
    memory = ConversationBufferMemory()
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=settings.GEMINI_API_KEY
    )
    chain = ConversationChain(llm=llm, memory=memory)
    return chain

chatbot = get_chatbot()