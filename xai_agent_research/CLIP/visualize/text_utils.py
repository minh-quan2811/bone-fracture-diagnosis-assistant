"""
Text encoding and similarity scoring utilities.
"""

from __future__ import annotations

import torch

from utils import feature_normalize, get_logit_scale


def encode_text_feature(
    model: torch.nn.Module,
    tokenizer,
    text: str,
    device: torch.device,
) -> torch.Tensor:
    """Encode text prompt to normalized feature vector."""
    tokens = tokenizer([text]).to(device)
    with torch.no_grad():
        text_feature = model.encode_text(tokens)
        text_feature = feature_normalize(text_feature)
    return text_feature


def clip_similarity_score(
    model: torch.nn.Module,
    dense_visual_tokens: torch.Tensor,
    text_feature: torch.Tensor,
    device: torch.device,
) -> torch.Tensor:
    """Compute CLIP similarity score between image and text."""
    img_feature = feature_normalize(dense_visual_tokens[:, 0, :])
    scale = get_logit_scale(model, device)
    return (scale * (img_feature @ text_feature.T)).squeeze()
