"""
Grad-CAM for Vision Transformer explainability method.
"""

from __future__ import annotations

import math
from typing import Dict

import torch
import torch.nn.functional as F

from forward_helpers import forward_visual_tokens_raw
from text_utils import clip_similarity_score
from utils import minmax_normalize


def compute_gradcam_vit(
    model: torch.nn.Module,
    image_tensor: torch.Tensor,
    text_feature: torch.Tensor,
    device: torch.device,
) -> torch.Tensor:
    """
    Compute Grad-CAM for Vision Transformer by computing gradients
    of CLIP score w.r.t. intermediate layer activations.
    """
    activation: Dict[str, torch.Tensor] = {}

    def save_activation(_module, _inputs, output):
        activation["value"] = output

    handle = model.visual.trunk.blocks[-1].norm1.register_forward_hook(save_activation)
    try:
        x = image_tensor.clone().detach().requires_grad_(True)
        dense_tokens = forward_visual_tokens_raw(model, x)
        score = clip_similarity_score(model, dense_tokens, text_feature, device)
        acts = activation["value"]
        grads = torch.autograd.grad(score, acts, retain_graph=False, create_graph=False)[0]

        acts = acts[:, 1:, :]   # remove CLS
        grads = grads[:, 1:, :]  # remove CLS
        weights = grads.mean(dim=1, keepdim=True)  # [B,1,C]
        cam = (weights * acts).sum(dim=-1)[0]  # [196]
        cam = F.relu(cam)
        grid = int(math.sqrt(cam.numel()))
        if grid * grid != cam.numel():
            raise ValueError(f"Grad-CAM patch count is not square: {cam.numel()}")
        return minmax_normalize(cam.reshape(grid, grid))
    finally:
        handle.remove()
