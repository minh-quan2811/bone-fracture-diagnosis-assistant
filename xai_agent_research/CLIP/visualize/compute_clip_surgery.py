"""
CLIP Surgery explainability method.
"""

from __future__ import annotations

import math

import torch

from forward_helpers import forward_visual_tokens_clip_surgery
from utils import minmax_normalize, feature_normalize


def compute_clip_surgery(
    model: torch.nn.Module,
    image_tensor: torch.Tensor,
    text_feature: torch.Tensor,
    redundant_feature: torch.Tensor,
) -> torch.Tensor:
    """
    Compute CLIP Surgery explanation by applying surgery path
    and computing similarity with text feature minus redundant feature.
    """
    with torch.no_grad():
        surgery_tokens = forward_visual_tokens_clip_surgery(model, image_tensor.clone().detach())
        surgery_tokens = feature_normalize(surgery_tokens)
        similarity = surgery_tokens @ (text_feature - redundant_feature).T  # [B, 197, 1]
        sm = similarity[:, 1:, 0][0]

    grid = int(math.sqrt(sm.numel()))
    if grid * grid != sm.numel():
        raise ValueError(f"CLIP Surgery patch count is not square: {sm.numel()}")
    return minmax_normalize(sm.reshape(grid, grid))
