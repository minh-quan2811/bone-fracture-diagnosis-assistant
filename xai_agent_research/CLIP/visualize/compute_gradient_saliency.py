"""
Gradient Saliency explainability method.
"""

from __future__ import annotations

import torch

from forward_helpers import forward_visual_tokens_raw
from text_utils import clip_similarity_score
from utils import minmax_normalize


def compute_gradient_saliency(
    model: torch.nn.Module,
    image_tensor: torch.Tensor,
    text_feature: torch.Tensor,
    device: torch.device,
) -> torch.Tensor:
    """
    Compute gradient saliency map by taking gradients of CLIP score w.r.t. input image.
    """
    x = image_tensor.clone().detach().requires_grad_(True)
    dense_tokens = forward_visual_tokens_raw(model, x)
    score = clip_similarity_score(model, dense_tokens, text_feature, device)
    grad = torch.autograd.grad(score, x, retain_graph=False, create_graph=False)[0]
    sal = grad.abs().mean(dim=1)[0]
    return minmax_normalize(sal)
