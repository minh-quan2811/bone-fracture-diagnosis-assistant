"""
Utility functions for image processing and tensor operations.
"""

from __future__ import annotations

from typing import Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image


def minmax_normalize(x: torch.Tensor, eps: float = 1e-8) -> torch.Tensor:
    """Normalize tensor to [0, 1] range."""
    x = x - x.min()
    return x / x.max().clamp(min=eps)


def to_numpy_image(img: Image.Image) -> np.ndarray:
    """Convert PIL image to numpy array with values in [0, 1]."""
    return np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0


def upsample_map(map_2d: torch.Tensor, out_hw: Tuple[int, int]) -> np.ndarray:
    """Upsample 2D heatmap to target height/width."""
    if map_2d.ndim != 2:
        raise ValueError(f"Expected a 2D map, got shape {tuple(map_2d.shape)}")
    h, w = out_hw
    up = F.interpolate(
        map_2d[None, None].float(),
        size=(h, w),
        mode="bilinear",
        align_corners=False,
    )[0, 0]
    return minmax_normalize(up).detach().cpu().numpy()


def overlay_heatmap(
    pil_img: Image.Image,
    heatmap: np.ndarray,
    alpha: float = 0.45,
    cmap_name: str = "jet",
) -> np.ndarray:
    """Overlay heatmap onto image with transparency."""
    rgb = to_numpy_image(pil_img)
    cmap = plt.get_cmap(cmap_name)
    heat_rgb = cmap(np.clip(heatmap, 0.0, 1.0))[..., :3].astype(np.float32)
    blended = (1.0 - alpha) * rgb + alpha * heat_rgb
    return np.clip(blended, 0.0, 1.0)


def feature_normalize(x: torch.Tensor) -> torch.Tensor:
    """Normalize features along last dimension."""
    return F.normalize(x, dim=-1)


def get_device(device_arg: Optional[str] = None) -> torch.device:
    """Get device, with auto-detection of CUDA availability."""
    if device_arg:
        return torch.device(device_arg)
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def get_logit_scale(model: torch.nn.Module, device: torch.device) -> torch.Tensor:
    """Get logit scale from model or return 1.0 if not available."""
    if hasattr(model, "logit_scale"):
        return model.logit_scale.exp()
    return torch.tensor(1.0, device=device)
