from typing import Dict, Any
import base64
import io
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from PIL import ImageDraw

from config.llm_models import llm_manager
from config.deep_learning_models import dl_model_manager
from config.constant_path import FractureConfig, PredictionPromptPath
from agents.prediction_agent.schemas import ReasoningState, StudentLabel

import torch
import warnings
warnings.filterwarnings("ignore")


def read_file_content(file_path: str) -> str:
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()


def image_to_base64(image):
    """Convert PIL Image to base64 string"""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()


REASONING_EVALUATION_PROMPT = read_file_content(str(PredictionPromptPath.PROMPT_DIR / "reasoning_evaluation.md"))


class PredictionAgent:
    def __init__(self):
        self.llm = llm_manager.get_llm_instance()
        self.dl_model = dl_model_manager.get_detr_model()
        self.workflow = self._create_workflow()
    
    def _create_workflow(self) -> StateGraph:
        workflow = StateGraph(ReasoningState)
        
        workflow.add_node("run_model_prediction", self._run_model_prediction_node)
        workflow.add_node("draw_bounding_boxes", self._draw_bounding_boxes_node)
        workflow.add_node("evaluate_reasoning", self._evaluate_reasoning_node)
        
        workflow.set_entry_point("run_model_prediction")
        workflow.add_edge("run_model_prediction", "draw_bounding_boxes")
        workflow.add_edge("draw_bounding_boxes", "evaluate_reasoning")
        workflow.add_edge("evaluate_reasoning", END)
        
        return workflow.compile()
    
    def _run_model_prediction_node(self, state: ReasoningState) -> Dict[str, Any]:
        detections = self.dl_model.predict(state["image"], threshold=0.5)
        
        if len(detections.class_id) > 0:
            first_detection = 0
            class_id = detections.class_id[first_detection]
            bbox = detections.xyxy[first_detection]
            
            state["model_class"] = FractureConfig.CLASS_TO_FRACTURE_TYPE[class_id]
            state["model_bbox"] = {
                "x_min": int(bbox[0]),
                "y_min": int(bbox[1]),
                "x_max": int(bbox[2]),
                "y_max": int(bbox[3])
            }
        
        return state
    
    def _draw_bounding_boxes_node(self, state: ReasoningState) -> Dict[str, Any]:
        """Draw student (blue) and model (red) bounding boxes on image"""
        img_copy = state["image"].copy()
        draw = ImageDraw.Draw(img_copy)
        
        # Draw student bbox (blue)
        draw.rectangle(
            [state["student_bbox"]["x_min"], state["student_bbox"]["y_min"],
             state["student_bbox"]["x_max"], state["student_bbox"]["y_max"]],
            outline="blue",
            width=5
        )
        
        # Draw model bbox (red)
        draw.rectangle(
            [state["model_bbox"]["x_min"], state["model_bbox"]["y_min"],
             state["model_bbox"]["x_max"], state["model_bbox"]["y_max"]],
            outline="red",
            width=5
        )
        
        state["annotated_image"] = img_copy
        return state
    
    async def _evaluate_reasoning_node(self, state: ReasoningState) -> Dict[str, Any]:
        evaluation_prompt = ChatPromptTemplate.from_template(REASONING_EVALUATION_PROMPT)
        
        # Convert annotated image to base64
        image_base64 = image_to_base64(state["annotated_image"])
        
        # Create message with image and text
        message_content = [
            {
                "type": "text",
                "text": evaluation_prompt.format(
                    student_class=state["student_class"],
                    model_class=state["model_class"],
                    student_note=state["student_note"]
                )
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{image_base64}"
                }
            }
        ]
        
        response = await self.llm.ainvoke([HumanMessage(content=message_content)])
        
        state["evaluation"] = response.content
        state["messages"].append(AIMessage(content=response.content))
        
        return state
    
    async def evaluate_student_work(self, student_label: StudentLabel) -> str:
        initial_state = ReasoningState(
            image=student_label.image,
            student_class=student_label.fracture_class,
            student_bbox={
                "x_min": student_label.bounding_box.x_min,
                "y_min": student_label.bounding_box.y_min,
                "x_max": student_label.bounding_box.x_max,
                "y_max": student_label.bounding_box.y_max
            },
            student_note=student_label.note,
            model_class="",
            model_bbox={},
            annotated_image=None,
            messages=[HumanMessage(content=student_label.note)],
            evaluation=""
        )
        
        final_state = await self.workflow.ainvoke(initial_state)
        return final_state["evaluation"]


prediction_agent = PredictionAgent()