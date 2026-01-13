import asyncio
import sys
from pathlib import Path
from PIL import Image

from langchain_core.messages import HumanMessage

sys.path.append(str(Path(__file__).resolve().parent.parent))

from agents.prediction_agent.prediction_agent import prediction_agent
from agents.prediction_agent.schemas import StudentLabel, BoundingBox, ReasoningState
from config.constant_path import DataPath

from utils import draw_bounding_boxes, create_evaluation_report

async def run_test_case(
    test_name,
    image_name,
    student_bbox,
    student_class,
    student_note
):
    """
    Run a single test case and generate report
    """
    # Load image
    image_path = DataPath.IMAGES_DIR / image_name
    image = Image.open(image_path)
    
    # Create student label
    student_label = StudentLabel(
        image=image,
        fracture_class=student_class,
        bounding_box=student_bbox,
        note=student_note
    )
    
    # Get evaluation
    evaluation = await prediction_agent.evaluate_student_work(student_label)
    
    # Get model prediction from workflow state    
    initial_state = ReasoningState(
        image=image,
        student_class=student_class,
        student_bbox={
            "x_min": student_bbox.x_min,
            "y_min": student_bbox.y_min,
            "x_max": student_bbox.x_max,
            "y_max": student_bbox.y_max
        },
        student_note=student_note,
        model_class="",
        model_bbox={},
        messages=[HumanMessage(content=student_note)],
        evaluation=""
    )
    
    # Run model prediction
    detections = prediction_agent.dl_model.predict(image, threshold=0.5)
    model_bbox = {}
    model_class = ""
    
    if len(detections.class_id) > 0:
        from config.constant_path import FractureConfig
        class_id = detections.class_id[0]
        bbox = detections.xyxy[0]
        
        model_class = FractureConfig.CLASS_TO_FRACTURE_TYPE[class_id]
        model_bbox = {
            "x_min": int(bbox[0]),
            "y_min": int(bbox[1]),
            "x_max": int(bbox[2]),
            "y_max": int(bbox[3])
        }
    
    # Draw bounding boxes
    student_bbox_dict = {
        "x_min": student_bbox.x_min,
        "y_min": student_bbox.y_min,
        "x_max": student_bbox.x_max,
        "y_max": student_bbox.y_max
    }
    
    image_with_boxes = draw_bounding_boxes(image, student_bbox_dict, model_bbox)
    
    # Create report
    report_dir = Path(__file__).parent / "reports"
    report_dir.mkdir(exist_ok=True)
    
    output_path = report_dir / f"{test_name}_report.docx"
    
    create_evaluation_report(
        image_with_boxes=image_with_boxes,
        student_class=student_class,
        model_class=model_class,
        student_note=student_note,
        evaluation_text=evaluation,
        output_path=str(output_path)
    )
    
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    print(f"Student Prediction: {student_class}")
    print(f"Model Prediction: {model_class}")
    print(f"Report saved: {output_path}")
    print(f"{'='*80}\n")


async def test_student_evaluation():
    """Test case for evaluating student's fracture classification"""
    
    await run_test_case(
        test_name="correct_spiral_fracture",
        image_name="1.jpg",
        student_bbox=BoundingBox(
            x_min=150,
            y_min=200,
            x_max=350,
            y_max=450
        ),
        student_class="spiral",
        student_note="I believe this is a spiral fracture because the fracture line appears to twist around the bone shaft in a helical pattern, which is typical of rotational forces applied to the bone."
    )


async def test_incorrect_classification():
    """Test case where student misclassifies the fracture"""
    
    await run_test_case(
        test_name="incorrect_transverse_classification",
        image_name="1.jpg",
        student_bbox=BoundingBox(
            x_min=100,
            y_min=150,
            x_max=300,
            y_max=400
        ),
        student_class="transverse",
        student_note="This looks like a transverse fracture to me because the fracture line goes straight across the bone."
    )


async def test_poor_reasoning():
    """Test case where student has correct classification but poor reasoning"""
    
    await run_test_case(
        test_name="poor_reasoning_comminuted",
        image_name="1.jpg",
        student_bbox=BoundingBox(
            x_min=120,
            y_min=180,
            x_max=320,
            y_max=420
        ),
        student_class="comminuted",
        student_note="I think it's comminuted because the bone looks broken."
    )


if __name__ == "__main__":
    # Run individual test
    asyncio.run(test_student_evaluation())
    
    # Or run all tests
    # asyncio.run(test_student_evaluation())
    # asyncio.run(test_incorrect_classification())
    # asyncio.run(test_poor_reasoning())