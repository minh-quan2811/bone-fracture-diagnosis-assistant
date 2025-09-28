import enum

class RoleEnum(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ASSISTANT = "assistant"