from enum import Enum

class MessageType(str, Enum):
    HUMAN = "human"
    AI = "ai"
