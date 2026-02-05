from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    SECRET_KEY: str
    POSTGRES_URL: str
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

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
    
    def get_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(',')]

settings = Settings()