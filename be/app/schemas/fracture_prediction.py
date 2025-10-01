from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.enums.prediction_source import PredictionSource
from app.enums.fracture_type import FractureType
from app.enums.body_region import BodyRegion

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
    fracture_type: Optional[FractureType] = None
    body_region: Optional[BodyRegion] = None
    bounding_box: BoundingBox

class StudentAnnotation(BaseModel):
    x_min: int
    y_min: int
    x_max: int
    y_max: int
    width: int
    height: int
    fracture_type: Optional[FractureType] = None
    body_region: Optional[BodyRegion] = None
    notes: Optional[str] = None

class StudentAnnotationsSubmit(BaseModel):
    annotations: List[StudentAnnotation]

class FractureDetectionOut(BaseModel):
    id: int
    prediction_id: int
    source: PredictionSource
    class_id: int
    class_name: str
    confidence: Optional[float]
    fracture_type: Optional[FractureType]
    body_region: Optional[BodyRegion]
    x_min: int
    y_min: int
    x_max: int
    y_max: int
    width: int
    height: int
    student_notes: Optional[str]
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
    has_student_predictions: bool
    has_ai_predictions: bool
    student_prediction_count: int
    ai_prediction_count: int
    model_version: str
    ai_inference_time: Optional[float]
    confidence_threshold: float
    ai_max_confidence: Optional[float]
    created_at: datetime
    student_predictions_at: Optional[datetime]
    ai_predictions_at: Optional[datetime]
    detections: List[FractureDetectionOut] = []

    class Config:
        from_attributes = True

class PredictionSummary(BaseModel):
    id: int
    image_filename: str
    has_student_predictions: bool
    has_ai_predictions: bool
    student_prediction_count: int
    ai_prediction_count: int
    ai_max_confidence: Optional[float]
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
    student_predictions: int
    ai_predictions: int
    average_ai_confidence: float
    fracture_types_distribution: Optional[dict] = None
    body_regions_distribution: Optional[dict] = None

class PredictionComparison(BaseModel):
    prediction_id: int
    image_filename: str
    student_detections: List[FractureDetectionOut]
    ai_detections: List[FractureDetectionOut]
    comparison_metrics: dict