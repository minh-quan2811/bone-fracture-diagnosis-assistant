"""
Attention Rollout explainability method.
"""

from __future__ import annotations

import math
from typing import List

import torch

from attention_tracer import VisualAttentionTracer
from forward_helpers import forward_visual_tokens_raw
from utils import minmax_normalize


def compute_attention_rollout(
    model: torch.nn.Module,
    image_tensor: torch.Tensor,
) -> torch.Tensor:
    """
    Compute attention rollout by tracing attention through all transformer blocks.
    """
    with VisualAttentionTracer(model.visual.trunk) as tracer:
        _ = forward_visual_tokens_raw(model, image_tensor.clone().detach())

    mats: List[torch.Tensor] = []
    for idx in range(len(model.visual.trunk.blocks)):
        attn = tracer.records[idx].attn_map.detach()  # [B, H, N, N]
        attn = attn.mean(dim=1)  # [B, N, N]
        eye = torch.eye(attn.shape[-1], device=attn.device, dtype=attn.dtype).unsqueeze(0)
        attn = attn + eye
        attn = attn / attn.sum(dim=-1, keepdim=True)
        mats.append(attn)

    joint = mats[0]
    for mat in mats[1:]:
        joint = mat.bmm(joint)

    rollout = joint[:, 0, 1:][0]
    grid = int(math.sqrt(rollout.numel()))
    if grid * grid != rollout.numel():
        raise ValueError(f"Attention rollout patch count is not square: {rollout.numel()}")
    return minmax_normalize(rollout.reshape(grid, grid))
