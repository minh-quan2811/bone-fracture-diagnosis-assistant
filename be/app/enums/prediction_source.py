from enum import Enum

class PredictionSource(str, Enum):
    STUDENT = "student"
    AI = "ai"