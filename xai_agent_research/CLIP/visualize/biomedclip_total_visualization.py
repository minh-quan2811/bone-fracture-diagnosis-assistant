#!/usr/bin/env python3
"""
BioMedCLIP explainability visualizer.
Combines multiple explainability methods to visualize model reasoning.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import torch
from PIL import Image

from compute_attention_rollout import compute_attention_rollout
from compute_clip_surgery import compute_clip_surgery
from compute_grad_eclip import compute_grad_eclip
from compute_gradcam_vit import compute_gradcam_vit
from compute_gradient_saliency import compute_gradient_saliency
from model_loading import load_biomedclip, validate_biomedclip_visual_architecture
from text_utils import encode_text_feature
from utils import get_device
from visualization import build_figure


def run(image_path: str, text_prompt: str, device: Optional[str] = None) -> Path:
    """Run full explainability pipeline and save visualization."""
    device = get_device(device)
    model, preprocess, tokenizer = load_biomedclip(device)
    validate_biomedclip_visual_architecture(model)

    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    pil_img = Image.open(image_path).convert("RGB")
    image_tensor = preprocess(pil_img).unsqueeze(0).to(device)

    if tuple(image_tensor.shape[-2:]) != (224, 224):
        raise ValueError(
            f"BioMedCLIP preprocessing should produce 224x224 inputs, got {tuple(image_tensor.shape[-2:])}"
        )

    text_feature = encode_text_feature(model, tokenizer, text_prompt, device)
    redundant_feature = encode_text_feature(model, tokenizer, "", device)

    # Compute all explainability maps
    clip_surgery_map = compute_clip_surgery(model, image_tensor, text_feature, redundant_feature)
    grad_eclip_map = compute_grad_eclip(model, image_tensor, text_feature, device)
    gradcam_map = compute_gradcam_vit(model, image_tensor, text_feature, device)
    rollout_map = compute_attention_rollout(model, image_tensor)
    saliency_map = compute_gradient_saliency(model, image_tensor, text_feature, device)

    # Validate map shapes
    for name, map_2d in {
        "CLIP Surgery": clip_surgery_map,
        "Grad-ECLIP": grad_eclip_map,
        "Grad-CAM": gradcam_map,
        "Attention Rollout": rollout_map,
    }.items():
        if tuple(map_2d.shape) != (14, 14):
            raise ValueError(f"{name} did not produce a 14x14 patch map; got {tuple(map_2d.shape)}")

    if saliency_map.ndim != 2:
        raise ValueError(f"Gradient saliency must be a 2D map; got shape {tuple(saliency_map.shape)}")

    if tuple(saliency_map.shape) != (224, 224):
        raise ValueError(
            f"Gradient saliency should produce a 224x224 pixel map after preprocessing; "
            f"got {tuple(saliency_map.shape)}"
        )

    # Create and save figure
    fig = build_figure(
        pil_img,
        clip_surgery_map,
        grad_eclip_map,
        gradcam_map,
        rollout_map,
        saliency_map,
    )

    out_dir = Path("total_visual_map")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{image_path.stem}_total_visualization.png"
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    print(f"Saved visualization to: {out_path}")
    return out_path


# Configuration - Edit these to change the image and folder name
IMAGE_FOLDER = "data/oblique"  # Change the folder path
IMAGE_NAME = "obli_2_cop.jpg"  # Change the image name
IMAGE_PATH = rf"../{IMAGE_FOLDER}/{IMAGE_NAME}"  # Relative path from visualize folder

TEXT_PROMPT = "bone fracture, comminuted fracture, x-ray, hand"  # Change this to your text prompt
DEVICE = None  # Set to "cuda" or "cpu", or leave as None for auto-detection

if __name__ == "__main__":
    output_path = run(
        IMAGE_PATH,
        TEXT_PROMPT,
        DEVICE
    )


IMAGE_FOLDER = "data/oblique"
IMAGE_NAME = "obli_2_cop.jpg"
IMAGE_PATH = rf"../{IMAGE_FOLDER}/{IMAGE_NAME}"

TEXT_PROMPT = "bone fracture, comminuted fracture, x-ray, hand"
DEVICE = None

if __name__ == "__main__":
    output_path = run(
        IMAGE_PATH,
        TEXT_PROMPT,
        DEVICE
    )
    print(f"Saved visualization to: {output_path}")
