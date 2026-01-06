import os
from pathlib import Path

class BasePath:
    BASE_DIR = Path(__file__).resolve().parent.parent   # XAI_AGENT_RESEARCH root directory
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

class PromptPath:
    BASE_DIR = BasePath.BASE_DIR
    PROMPTS_DIR = BASE_DIR / "agents" / "prediction_agent" / "prompts"
    
    REASONING_EVALUATION_PROMPT_PATH = PROMPTS_DIR / "reasoning_evaluation.md"

class APIConfig:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class FractureConfig:
    CLASS_TO_FRACTURE_TYPE = {
        0: "comminuted",
        1: "greenstick",
        2: "oblique",
        3: "spiral",
        4: "transverse"
    }