import enum

class RoleEnum(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    assistant = "assistant"