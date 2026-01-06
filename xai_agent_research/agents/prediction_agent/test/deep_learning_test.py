import warnings
import torch
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
import supervision as sv
from rfdetr import RFDETRSmall

from xai_agent_research.config.constant_path import FractureConfig, ModelPath, DataPath

# suppress tracer warnings
warnings.filterwarnings("ignore", category=torch.jit.TracerWarning)
warnings.filterwarnings("ignore")


# Load and optimize model
model = RFDETRSmall(
    num_classes=len(FractureConfig.CLASS_TO_FRACTURE_TYPE),
    pretrain_weights=str(ModelPath.RFDETR_MODEL_PATH)
)
model.optimize_for_inference()

# Show image grid
def show_image_grid(images, grid_size, titles=None, size=(8, 8)):
    nrows, ncols = grid_size
    fig, axes = plt.subplots(nrows, ncols, figsize=size)

    if not isinstance(axes, np.ndarray):
        axes = np.array([[axes]])

    axes_flat = axes.flatten()

    for idx, ax in enumerate(axes_flat):
        ax.axis("off")
        if idx < len(images):
            img = images[idx]
            if hasattr(img, "mode"):
                img = np.array(img)
            ax.imshow(img)
            if titles and idx < len(titles):
                ax.set_title(titles[idx])
    plt.show()

# Inference and visualization 
image_paths = [
    str(DataPath.IMAGES_DIR) + "/2.png",
]

for img_path in image_paths:
    image = Image.open(img_path).convert("RGB")
    detections = model.predict(image, threshold=0.5)

    # Filter out invalid class IDs
    valid_indices = [i for i, cid in enumerate(detections.class_id) 
                     if cid in FractureConfig.CLASS_TO_FRACTURE_TYPE]
    if not valid_indices:
        print(f"No valid detections in {img_path}")
        continue

    # Keep only valid detections
    filtered = sv.Detections(
        xyxy=detections.xyxy[valid_indices],
        mask=None,
        confidence=detections.confidence[valid_indices],
        class_id=detections.class_id[valid_indices],
        tracker_id=detections.tracker_id,
        data={},
        metadata={}
    )

    # Visual annotators
    text_scale = sv.calculate_optimal_text_scale(resolution_wh=image.size)
    thickness = sv.calculate_optimal_line_thickness(resolution_wh=image.size)
    color = sv.ColorPalette.from_hex([
        "#ffff00", "#ff9b00", "#ff66ff", "#3399ff", "#ff66b2",
        "#ff8080", "#b266ff", "#9999ff", "#66ffff", "#33ff99"
    ])

    bbox_annotator = sv.BoxAnnotator(color=color, thickness=thickness)
    label_annotator = sv.LabelAnnotator(
        color=color, text_color=sv.Color.BLACK, text_scale=text_scale
    )

    # Prepare labels from mapping
    labels = [
        f"{FractureConfig.CLASS_TO_FRACTURE_TYPE[int(cid)]} {conf:.2f}"
        for cid, conf in zip(filtered.class_id, filtered.confidence)
    ]

    annotated = image.copy()
    annotated = bbox_annotator.annotate(annotated, filtered)
    annotated = label_annotator.annotate(annotated, filtered, labels)

    show_image_grid(
        images=[annotated],
        grid_size=(1, 1),
        titles=[f"Prediction: {img_path.split('/')[-1]}"]
    )
