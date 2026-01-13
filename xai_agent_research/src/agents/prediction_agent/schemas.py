from typing import List, Dict, Any, TypedDict
from dataclasses import dataclass
from langchain_core.messages import BaseMessage
from PIL import Image


class ReasoningState(TypedDict):
    image: Image.Image
    student_class: str
    student_bbox: Dict[str, int]
    student_note: str
    model_class: str
    model_bbox: Dict[str, int]
    annotated_image: Image.Image
    messages: List[BaseMessage]
    evaluation: str


@dataclass
class BoundingBox:
    x_min: int
    y_min: int
    x_max: int
    y_max: int


@dataclass
class StudentLabel:
    image: Image.Image
    fracture_class: str
    bounding_box: BoundingBox
    note: str


@dataclass
class ModelPrediction:
    fracture_class: str
    bounding_box: BoundingBox