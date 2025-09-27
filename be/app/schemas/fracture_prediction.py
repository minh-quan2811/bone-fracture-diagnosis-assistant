from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BoundingBox(BaseModel):
    x_min: int
    y_min: int
    x_max: int
    y_max: int
    width: int
    height: int

class DetectionResult(BaseModel):
    class_id: int
    class_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    bounding_box: BoundingBox

class FractureDetectionOut(BaseModel):
    id: int
    prediction_id: int
    class_id: int
    class_name: str
    confidence: float
    x_min: int
    y_min: int
    x_max: int
    y_max: int
    width: int
    height: int
    created_at: datetime

    class Config:
        from_attributes = True

class FracturePredictionOut(BaseModel):
    id: int
    user_id: int
    image_filename: str
    image_path: str
    image_size: Optional[int]
    image_width: Optional[int]
    image_height: Optional[int]
    image_format: Optional[str]
    has_fracture: bool
    detection_count: int
    max_confidence: Optional[float]
    model_version: str
    inference_time: Optional[float]
    confidence_threshold: float
    created_at: datetime
    detections: List[FractureDetectionOut] = []

    class Config:
        from_attributes = True

class PredictionSummary(BaseModel):
    id: int
    image_filename: str
    has_fracture: bool
    detection_count: int
    max_confidence: Optional[float]
    created_at: datetime

class YOLOv8Response(BaseModel):
    has_fracture: bool
    detection_count: int
    max_confidence: Optional[float]
    detections: List[DetectionResult]
    inference_time: float
    image_dimensions: dict

class PredictionStats(BaseModel):
    total_predictions: int
    fracture_predictions: int
    normal_predictions: int
    average_confidence: float