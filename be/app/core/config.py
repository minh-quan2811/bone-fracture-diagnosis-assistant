from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    SECRET_KEY: str
    POSTGRES_URL: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    GEMINI_API_KEY: str
    QDRANT_API_KEY: str
    QDRANT_URL: str
    COHERE_API_KEY: str
    LLAMA_CLOUD_API_KEY: str
    ENV_MODE: str = "local"
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str
    S3_BUCKET_IMAGES: str
    S3_BUCKET_DOCUMENTS: str
    ALLOWED_ORIGINS: str
    REDIS_URL: str
    LANGSMITH_TRACING: str
    LANGSMITH_API_KEY: str
    LANGSMITH_PROJECT: str

    MEMORY_REDIS_TTL_SECONDS: int = 7200          # 2 hours, reset on every write
    MEMORY_REDIS_TOKEN_BUDGET: int = 2000         # trigger summarization above this
    MEMORY_SUMMARY_TOKEN_LIMIT: int = 500         # max size of the Postgres summary
    MEMORY_SUMMARIZE_OLDEST_RATIO: float = 0.6    # fraction (by tokens) sent to summarizer
    MEMORY_FILLER_MIN_CHARS: int = 15             # messages shorter than this are dropped
    MEMORY_SYSTEM_PROMPT_TOKENS: int = 200        # fixed system prompt budget (informational)

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
    
    def get_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(',')]

settings = Settings()