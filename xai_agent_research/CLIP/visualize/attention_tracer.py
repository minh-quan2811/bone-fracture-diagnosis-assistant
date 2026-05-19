"""
Attention tracing for Vision Transformer models.
"""

from __future__ import annotations

import types
from dataclasses import dataclass
from typing import Dict, Optional

import torch


@dataclass
class AttentionRecord:
    """Records attention activations and projections from a single layer."""
    attn_map: torch.Tensor
    attn_output_preproj: torch.Tensor
    q_proj_tokens: torch.Tensor
    k_proj_tokens: torch.Tensor
    v_tokens: torch.Tensor


class VisualAttentionTracer:
    """Context manager to trace attention during forward pass."""
    
    def __init__(self, trunk: torch.nn.Module):
        self.trunk = trunk
        self.records: Dict[int, AttentionRecord] = {}
        self._original_forwards: Dict[int, object] = {}

    @staticmethod
    def _reassemble_tokens(x: torch.Tensor) -> torch.Tensor:
        """Convert [B, H, N, D] to [B, N, H*D]."""
        return x.transpose(1, 2).reshape(x.shape[0], x.shape[2], -1)

    def _make_forward(self, module: torch.nn.Module, idx: int):
        """Create a traced forward function for an attention module."""
        tracer = self

        def traced_forward(
            attn_self: torch.nn.Module,
            x: torch.Tensor,
            attn_mask: Optional[torch.Tensor] = None,
            **kwargs,
        ) -> torch.Tensor:
            # Keep the monkey-patched signature compatible with timm Attention.forward.
            bsz, ntok, dim = x.shape
            heads = attn_self.num_heads
            head_dim = dim // heads

            qkv = (
                attn_self.qkv(x)
                .reshape(bsz, ntok, 3, heads, head_dim)
                .permute(2, 0, 3, 1, 4)
            )
            q, k, v = qkv.unbind(0)
            q = attn_self.q_norm(q)
            k = attn_self.k_norm(k)

            q_scaled = q * attn_self.scale
            attn = q_scaled @ k.transpose(-2, -1)

            if attn_mask is not None:
                # Match timm's unfused path: additive mask before softmax.
                attn = attn + attn_mask

            attn = attn.softmax(dim=-1)
            attn = attn_self.attn_drop(attn)

            attn_output = attn @ v
            attn_output = attn_output.transpose(1, 2).reshape(bsz, ntok, dim)
            attn_output = attn_self.norm(attn_output)

            q_tokens = tracer._reassemble_tokens(q)
            k_tokens = tracer._reassemble_tokens(k)
            v_tokens = tracer._reassemble_tokens(v)
            q_proj = attn_self.proj(q_tokens)
            k_proj = attn_self.proj(k_tokens)

            tracer.records[idx] = AttentionRecord(
                attn_map=attn,
                attn_output_preproj=attn_output,
                q_proj_tokens=q_proj,
                k_proj_tokens=k_proj,
                v_tokens=v_tokens,
            )

            out = attn_self.proj(attn_output)
            out = attn_self.proj_drop(out)
            return out

        return types.MethodType(traced_forward, module)

    def __enter__(self):
        self.records.clear()
        for idx, block in enumerate(self.trunk.blocks):
            attn_mod = block.attn
            self._original_forwards[idx] = attn_mod.forward
            attn_mod.forward = self._make_forward(attn_mod, idx)
        return self

    def __exit__(self, exc_type, exc, tb):
        for idx, block in enumerate(self.trunk.blocks):
            block.attn.forward = self._original_forwards[idx]
        self._original_forwards.clear()
        return False
