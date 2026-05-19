# BioMedCLIP Explainability Visualizer

## Structure

The explainability visualizer has been decomposed into modular components for better maintainability and reusability.

### Files Overview

#### Core Execution
- **`biomedclip_total_visualization.py`** - Main entry point. Orchestrates all explainability methods and generates visualizations.
  - Edit `IMAGE_FOLDER` and `IMAGE_NAME` to change input image
  - Edit `TEXT_PROMPT` to change the text description
  - Edit `DEVICE` to specify which device to use

#### Utility Functions
- **`utils.py`** - General tensor/image operations
  - `minmax_normalize()` - Normalize tensors to [0, 1]
  - `to_numpy_image()` - Convert PIL image to numpy
  - `upsample_map()` - Upsample 2D heatmaps
  - `overlay_heatmap()` - Blend heatmap onto image
  - `feature_normalize()` - Normalize feature vectors
  - `get_device()` - Auto-detect CUDA/CPU
  - `get_logit_scale()` - Get model logit scale

#### Model Management
- **`model_loading.py`** - BioMedCLIP model initialization
  - `load_biomedclip()` - Load model, preprocessor, and tokenizer
  - `validate_biomedclip_visual_architecture()` - Verify ViT-B/16 architecture

#### Forward Passes
- **`forward_helpers.py`** - Vision Transformer forward pass utilities
  - `vit_embed_tokens()` - Embed patches with positional encoding
  - `forward_visual_tokens_raw()` - Standard forward through visual tower
  - `forward_visual_tokens_clip_surgery()` - Architecture surgery path

#### Attention Analysis
- **`attention_tracer.py`** - Trace attention during forward pass
  - `AttentionRecord` - Data class for storing attention activations
  - `VisualAttentionTracer` - Context manager for hooking attention modules

#### Text Processing
- **`text_utils.py`** - Text encoding and scoring
  - `encode_text_feature()` - Encode text to feature vector
  - `clip_similarity_score()` - Compute CLIP similarity score

#### Explainability Methods

Each method is in its own file for easy modification and testing:

1. **`compute_gradient_saliency.py`**
   - Computes gradients of CLIP score w.r.t. input image
   - Returns 224x224 pixel-level saliency map

2. **`compute_attention_rollout.py`**
   - Traces attention through all transformer blocks
   - Returns 14x14 patch-level heatmap

3. **`compute_gradcam_vit.py`**
   - Computes gradients of CLIP score w.r.t. layer activations
   - Returns 14x14 patch-level class activation map

4. **`compute_grad_eclip.py`**
   - Combines attention gradients with query-key similarity
   - Returns 14x14 patch-level explanation

5. **`compute_clip_surgery.py`**
   - Uses architecture surgery path for interpretation
   - Returns 14x14 patch-level importance scores

#### Visualization
- **`visualization.py`** - Figure generation
  - `build_figure()` - Creates 2x3 comparison plot of all methods

## Usage

Simply edit the configuration variables at the end of `biomedclip_total_visualization.py`:

```python
IMAGE_FOLDER = "data/oblique"      # Change folder
IMAGE_NAME = "obli_2_cop.jpg"      # Change image name
TEXT_PROMPT = "..."                # Change text prompt
DEVICE = None                      # Change device
```

Then run:
```bash
python biomedclip_total_visualization.py
```

Output visualizations are saved to `total_visual_map/` directory.

## Dependencies

- torch
- torchvision
- open_clip_torch
- transformers
- PIL
- matplotlib
- numpy

## Adding New Methods

To add a new explainability method:

1. Create `compute_new_method.py` with a function `compute_new_method()`
2. Import it in `biomedclip_total_visualization.py`
3. Call it in the `run()` function
4. Update `build_figure()` to include the new visualization
