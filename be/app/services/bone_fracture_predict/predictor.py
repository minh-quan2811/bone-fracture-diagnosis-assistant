import os
import cv2
import numpy as np
from typing import Dict
from ultralytics import YOLO
import time


class BoneFracturePredictorModel:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "fracture_model.pt")
        self.model = None
        self.confidence_threshold = 0.25
        self.iou_threshold = 0.45
        self.load_model()

    def load_model(self):
        """Load YOLOv8 model from .pt file."""
        try:
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                print(f"YOLOv8 fracture model loaded from {self.model_path}")
                print(f"Model classes: {self.model.names}")
            else:
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to load YOLOv8 model: {e}")

    def predict(self, image_data: bytes) -> Dict:
        """
        Run real YOLOv8 inference on an input image (in bytes).
        Returns dictionary with detection results.
        """
        try:
            # Decode image bytes to OpenCV array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError("Could not decode input image.")

            height, width = image.shape[:2]
            channels = image.shape[2] if len(image.shape) > 2 else 1

            # Run inference
            start_time = time.time()
            results = self.model.predict(
                source=image,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                verbose=False
            )
            inference_time = time.time() - start_time

            # Parse results
            detections = []
            max_confidence = 0.0

            for result in results:
                if result.boxes is not None and len(result.boxes) > 0:
                    for box in result.boxes:
                        xyxy = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0].cpu().numpy())
                        cls_id = int(box.cls[0].cpu().numpy())
                        class_name = self.model.names.get(cls_id, f"class_{cls_id}")

                        x1, y1, x2, y2 = map(int, xyxy)
                        detections.append({
                            "class_id": cls_id,
                            "class_name": class_name,
                            "confidence": conf,
                            "bounding_box": {
                                "x_min": x1,
                                "y_min": y1,
                                "x_max": x2,
                                "y_max": y2,
                                "width": x2 - x1,
                                "height": y2 - y1
                            }
                        })
                        max_confidence = max(max_confidence, conf)

            return {
                "has_fracture": len(detections) > 0,
                "detection_count": len(detections),
                "max_confidence": max_confidence if detections else None,
                "detections": detections,
                "inference_time": round(inference_time, 4),
                "image_dimensions": {"width": width, "height": height, "channels": channels}
            }

        except Exception as e:
            raise RuntimeError(f"YOLOv8 prediction failed: {e}")

    # Testing Utility
    def predict_from_file(self, file_path: str) -> Dict:
        """Run prediction directly from an image file path."""
        try:
            with open(file_path, 'rb') as f:
                image_data = f.read()
            return self.predict(image_data)
        except Exception as e:
            raise RuntimeError(f"File prediction failed: {e}")


fracture_predictor = BoneFracturePredictorModel()

# Testing predictions
# if __name__ == "__main__":
#     print("\nRunning self-test for BoneFracturePredictorModel...\n")

#     MODEL_PATH = r"C:\Users\Admin\Desktop\School_Projects\Bone_Fractures\be\app\services\bone_fracture_predict\fracture_model.pt"
#     TEST_IMAGE = r"C:\Users\Admin\Downloads\7.jpg"
#     # Model classes: {0: 'comminuted', 1: 'compound', 2: 'greenstick', 3: 'splint', 4: 'transverse'}

#     # Initialize model
#     model = BoneFracturePredictorModel(model_path=MODEL_PATH)

#     if os.path.exists(TEST_IMAGE):
#         print(f"Running detection on: {TEST_IMAGE}\n")
#         result = model.predict_from_file(TEST_IMAGE)
#         print("Detection Result:")
#         print(result)
#     else:
#         print(f"Test image not found at: {TEST_IMAGE}")
