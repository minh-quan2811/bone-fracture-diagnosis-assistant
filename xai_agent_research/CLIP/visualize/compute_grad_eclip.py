"""
Grad-ECLIP explainability method.
"""

from __future__ import annotations

import math

import torch
import torch.nn.functional as F

from attention_tracer import VisualAttentionTracer
from forward_helpers import forward_visual_tokens_raw
from text_utils import clip_similarity_score
from utils import minmax_normalize, feature_normalize


def compute_grad_eclip(
    model: torch.nn.Module,
    image_tensor: torch.Tensor,
    text_feature: torch.Tensor,
    device: torch.device,
    use_k_similarity: bool = True,
) -> torch.Tensor:
    """
    Compute Grad-ECLIP explanation by combining attention gradients
    with query-key similarity scores.
    """
    with VisualAttentionTracer(model.visual.trunk) as tracer:
        x = image_tensor.clone().detach().requires_grad_(True)
        dense_tokens = forward_visual_tokens_raw(model, x)
        score = clip_similarity_score(model, dense_tokens, text_feature, device)
        rec = tracer.records[len(model.visual.trunk.blocks) - 1]

        grad = torch.autograd.grad(
            score,
            rec.attn_output_preproj,
            retain_graph=False,
            create_graph=False,
        )[0]

    grad_cls = grad[:, 0, :]  # [1, C]
    v_patch = rec.v_tokens[:, 1:, :]  # [1, 196, C]

    if use_k_similarity:
        q_cls = feature_normalize(rec.q_proj_tokens[:, 0:1, :])
        k_patch = feature_normalize(rec.k_proj_tokens[:, 1:, :])
        cosine = (q_cls * k_patch).sum(dim=-1)
        cosine = minmax_normalize(cosine)
        emap = (grad_cls.unsqueeze(1) * v_patch * cosine.unsqueeze(-1)).sum(dim=-1)[0]
    else:
        emap = (grad_cls.unsqueeze(1) * v_patch).sum(dim=-1)[0]

    emap = F.relu(emap)
    grid = int(math.sqrt(emap.numel()))
    if grid * grid != emap.numel():
        raise ValueError(f"Grad-ECLIP patch count is not square: {emap.numel()}")
    return minmax_normalize(emap.reshape(grid, grid))
