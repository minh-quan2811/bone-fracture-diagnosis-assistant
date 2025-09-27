from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class FracturePrediction(Base):
    __tablename__ = "fracture_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Image information
    image_filename = Column(String(255), nullable=False)
    image_path = Column(String(500), nullable=False)
    image_size = Column(Integer, nullable=True)
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    image_format = Column(String(10), nullable=True)
    
    # YOLOv8 Results
    has_fracture = Column(Boolean, default=False)
    detection_count = Column(Integer, default=0)
    max_confidence = Column(Float, nullable=True)
    
    # Model Information
    model_version = Column(String(50), default="YOLOv8")
    inference_time = Column(Float, nullable=True)
    confidence_threshold = Column(Float, default=0.25)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="fracture_predictions")
    detections = relationship("FractureDetection", back_populates="prediction", cascade="all, delete-orphan")

class FractureDetection(Base):
    __tablename__ = "fracture_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("fracture_predictions.id"), nullable=False)
    
    # YOLOv8 Detection Results
    class_id = Column(Integer, nullable=False)
    class_name = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    
    # Bounding box coordinates
    x_min = Column(Integer, nullable=False)
    y_min = Column(Integer, nullable=False)
    x_max = Column(Integer, nullable=False)
    y_max = Column(Integer, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    prediction = relationship("FracturePrediction", back_populates="detections")