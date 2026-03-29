"""
Visual tower forward pass helpers for ViT-based models.
"""

from __future__ import annotations

from typing import Optional

import torch


def _manual_pos_embed(trunk: torch.nn.Module, x: torch.Tensor) -> torch.Tensor:
    """Standard timm ViT fallback for positional embedding."""
    bsz = x.shape[0]
    cls_token = trunk.cls_token.expand(bsz, -1, -1)
    x = torch.cat((cls_token, x), dim=1)
    pos_embed = trunk.pos_embed
    if pos_embed.shape[1] != x.shape[1]:
        raise ValueError(
            f"Unexpected token count mismatch: pos_embed has {pos_embed.shape[1]} tokens, "
            f"but current sequence has {x.shape[1]}. This script is written for the 224x224 "
            f"BioMedCLIP ViT-B/16 setting (197 tokens incl. CLS)."
        )
    x = x + pos_embed
    x = trunk.pos_drop(x)
    return x


def vit_embed_tokens(trunk: torch.nn.Module, image: torch.Tensor) -> torch.Tensor:
    """Embed image patches into tokens with positional encoding."""
    x = trunk.patch_embed(image)
    if hasattr(trunk, "_pos_embed"):
        x = trunk._pos_embed(x)
    else:
        x = _manual_pos_embed(trunk, x)
    x = trunk.patch_drop(x)
    x = trunk.norm_pre(x)
    return x


def forward_visual_tokens_raw(model: torch.nn.Module, image: torch.Tensor) -> torch.Tensor:
    """Forward pass through visual tower to get dense token representations."""
    trunk = model.visual.trunk
    x = vit_embed_tokens(trunk, image)
    for block in trunk.blocks:
        x = block(x)
    x = trunk.norm(x)
    x = model.visual.head(x)
    return x


def consistent_attention_forward(block: torch.nn.Module, x: torch.Tensor) -> torch.Tensor:
    """
    CLIP Surgery consistent self-attention for a timm ViT block:
        softmax(scale * V V^T) V
    followed by the block's existing attention projection path, but without FFN.
    """
    attn_mod = block.attn
    x_norm = block.norm1(x)
    bsz, ntok, dim = x_norm.shape
    heads = attn_mod.num_heads
    head_dim = dim // heads

    qkv = attn_mod.qkv(x_norm).reshape(bsz, ntok, 3, heads, head_dim).permute(2, 0, 3, 1, 4)
    q, k, v = qkv.unbind(0)
    q = attn_mod.q_norm(q)
    k = attn_mod.k_norm(k)
    del q, k  # not used in consistent self-attention

    attn = (v @ v.transpose(-2, -1)) * attn_mod.scale
    attn = attn.softmax(dim=-1)
    attn = attn_mod.attn_drop(attn)

    y = attn @ v
    y = y.transpose(1, 2).reshape(bsz, ntok, dim)
    y = attn_mod.norm(y)
    y = attn_mod.proj(y)
    y = attn_mod.proj_drop(y)

    if hasattr(block, "ls1"):
        y = block.ls1(y)
    if hasattr(block, "drop_path1"):
        y = block.drop_path1(y)
    return y


def forward_visual_tokens_clip_surgery(
    model: torch.nn.Module,
    image: torch.Tensor,
    start_block_idx: int = 6,
) -> torch.Tensor:
    """
    Architecture surgery path for a 12-block ViT-B/16 trunk.

    The CLIP Surgery paper uses depth d=7 for ViT-B/16. Converting the paper's
    one-based block indexing to Python's zero-based indexing means the surgery path
    starts from block index 6, i.e. the last 6 transformer blocks.
    """
    trunk = model.visual.trunk
    x = vit_embed_tokens(trunk, image)

    surgery_x: Optional[torch.Tensor] = None
    for idx, block in enumerate(trunk.blocks):
        x_in = x
        x = block(x)

        if idx < start_block_idx:
            continue

        if surgery_x is None:
            surgery_input = x_in
        else:
            surgery_input = surgery_x

        surgery_x = surgery_input + consistent_attention_forward(block, surgery_input)

    if surgery_x is None:
        raise RuntimeError("Surgery path was never created; start_block_idx is too large.")

    surgery_x = trunk.norm(surgery_x)
    surgery_x = model.visual.head(surgery_x)
    return surgery_x
