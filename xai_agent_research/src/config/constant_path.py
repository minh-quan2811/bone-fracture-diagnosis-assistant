import os
from pathlib import Path
from pydantic_settings import BaseSettings

class BasePath:
    BASE_DIR = Path(__file__).resolve().parent.parent   # src root directory
    PROJECT_ROOT = BASE_DIR.parent                      #xai_agent root directory
    CONFIG_DIR = BASE_DIR / "config"

class DataPath:
    BASE_DIR = BasePath.BASE_DIR
    DATA_DIR = BASE_DIR / "data"
    
    IMAGES_DIR = DATA_DIR / "fractured_image"
    ANNOTATIONS_DIR = DATA_DIR / "annotations"
    RESULTS_DIR = DATA_DIR / "results"

class ModelPath:
    BASE_DIR = BasePath.BASE_DIR
    MODELS_DIR = BASE_DIR / "dl_models"
    
    RFDETR_MODEL_PATH = MODELS_DIR / "checkpoint_small_1.pth"

class PredictionPromptPath:
    BASE_DIR = BasePath.BASE_DIR
    PROMPT_DIR = BASE_DIR / "agents" / "prediction_agent" / "prompts"

class APIConfig(BaseSettings):
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str

api_config = APIConfig(_env_file=str(BasePath.PROJECT_ROOT / '.env'), _env_file_encoding='utf-8')

class FractureConfig:
    CLASS_TO_FRACTURE_TYPE = {
        0: "comminuted",
        1: "greenstick",
        2: "oblique",
        3: "spiral",
        4: "transverse"
    }