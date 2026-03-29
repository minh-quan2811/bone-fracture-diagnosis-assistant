"""
Visualization and figure building utilities.
"""

from __future__ import annotations

import matplotlib.pyplot as plt
import torch
from PIL import Image

from utils import overlay_heatmap, upsample_map


def build_figure(
    pil_img: Image.Image,
    clip_surgery_map: torch.Tensor,
    grad_eclip_map: torch.Tensor,
    gradcam_map: torch.Tensor,
    rollout_map: torch.Tensor,
    saliency_map: torch.Tensor,
) -> plt.Figure:
    """Build a 2x3 figure comparing all explainability methods."""
    h, w = pil_img.height, pil_img.width

    clip_surgery_overlay = overlay_heatmap(pil_img, upsample_map(clip_surgery_map, (h, w)))
    grad_eclip_overlay = overlay_heatmap(pil_img, upsample_map(grad_eclip_map, (h, w)))
    gradcam_overlay = overlay_heatmap(pil_img, upsample_map(gradcam_map, (h, w)))
    rollout_overlay = overlay_heatmap(pil_img, upsample_map(rollout_map, (h, w)))
    saliency_overlay = overlay_heatmap(pil_img, upsample_map(saliency_map, (h, w)))

    fig, axes = plt.subplots(2, 3, figsize=(18, 10), constrained_layout=True)
    axs = axes.ravel()

    axs[0].imshow(pil_img)
    axs[0].set_title("Original image")

    axs[1].imshow(clip_surgery_overlay)
    axs[1].set_title("CLIP Surgery")

    axs[2].imshow(grad_eclip_overlay)
    axs[2].set_title("Grad-ECLIP")

    axs[3].imshow(gradcam_overlay)
    axs[3].set_title("Grad-CAM")

    axs[4].imshow(rollout_overlay)
    axs[4].set_title("Attention Rollout")

    axs[5].imshow(saliency_overlay)
    axs[5].set_title("Gradient saliency")

    for ax in axs:
        ax.axis("off")

    return fig
