"""
Save BiomedCLIP model structure to text files:
  - model_structure_full.txt       : entire model
  - model_structure_vision.txt     : vision encoder (visual backbone)
  - model_structure_text.txt       : text encoder (text backbone)
"""

import open_clip


def get_model_str(module) -> str:
    """Return the string representation of a module."""
    return str(module)


def save_structure(content: str, filepath: str) -> None:
    """Print content to stdout and write it to a file."""
    print(content)
    print("\n" + "=" * 80 + "\n")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved to: {filepath}\n")


def main():
    model_name = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"

    print("Loading model...")
    model, _, _ = open_clip.create_model_and_transforms(model_name)
    model.eval()
    print("Model loaded.\n")

    # 1. Full model
    print("=" * 80)
    print("FULL MODEL STRUCTURE")
    print("=" * 80 + "\n")
    save_structure(get_model_str(model), "model_structure_full.txt")

    # 2. Vision encoder
    vision_encoder = model.visual
    print("=" * 80)
    print("VISION ENCODER STRUCTURE")
    print("=" * 80 + "\n")
    save_structure(get_model_str(vision_encoder), "model_structure_vision.txt")

    # 3. Text encoder
    if hasattr(model, "text"):
        text_encoder = model.text
        label = "TEXT ENCODER (model.text)"
    elif hasattr(model, "transformer"):
        text_encoder = model.transformer
        label = "TEXT ENCODER (model.transformer)"
    else:
        raise AttributeError(
            "Could not locate a text encoder. "
            "Inspect model attributes with: print(dir(model))"
        )

    print("=" * 80)
    print(label)
    print("=" * 80 + "\n")
    save_structure(get_model_str(text_encoder), "model_structure_text.txt")

    print("Done. Three structure files saved:")
    print("  model_structure_full.txt")
    print("  model_structure_vision.txt")
    print("  model_structure_text.txt")


if __name__ == "__main__":
    main()