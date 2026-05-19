"""
Model loading and validation functions for BioMedCLIP.
"""

from __future__ import annotations

import torch

from utils import get_device


def load_biomedclip(device: torch.device):
    """Load BioMedCLIP model, preprocessing, and tokenizer."""
    try:
        import open_clip
    except ImportError as exc:
        raise ImportError(
            "open_clip_torch is required. Install it with `pip install open_clip_torch transformers`"
        ) from exc

    model_id = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
    model, preprocess = open_clip.create_model_from_pretrained(model_id)
    tokenizer = open_clip.get_tokenizer(model_id)
    model = model.to(device)
    model.eval()
    return model, preprocess, tokenizer


def validate_biomedclip_visual_architecture(model: torch.nn.Module) -> None:
    """Validate that the model has the expected ViT-B/16 architecture."""
    visual = model.visual
    trunk = visual.trunk

    if trunk.patch_embed.proj.kernel_size != (16, 16) or trunk.patch_embed.proj.stride != (16, 16):
        raise ValueError(
            f"Expected 16x16 patch embedding with stride 16, got kernel={trunk.patch_embed.proj.kernel_size}, "
            f"stride={trunk.patch_embed.proj.stride}"
        )

    if len(trunk.blocks) != 12:
        raise ValueError(f"Expected 12 transformer blocks, got {len(trunk.blocks)}")

    if not hasattr(visual.head, "proj"):
        raise ValueError("Expected visual.head.proj to exist for the 512-dim projection head.")

    proj = visual.head.proj
    if getattr(proj, "out_features", None) != 512:
        raise ValueError(f"Expected 512-dim projection head, got {getattr(proj, 'out_features', None)}")
