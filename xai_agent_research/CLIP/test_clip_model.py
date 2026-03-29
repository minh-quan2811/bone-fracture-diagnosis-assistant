"""
Bone Fracture Classification using BioMedCLIP
Complete test script for fracture X-ray classification
"""

import os
import sys
import torch
from PIL import Image
from pathlib import Path
import open_clip
from collections import defaultdict
import json
from datetime import datetime


class BoneFractureDataset:
    """Load bone fracture X-ray dataset"""
    
    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
        self.images = []
        self.labels = []
        self.descriptions = []
        self.fracture_types = []
        
        if not self.data_dir.exists():
            print(f"Error: Directory '{data_dir}' not found!")
            sys.exit(1)
        
        # Load descriptions from file if exists
        descriptions_file = Path("image_descriptions.txt")
        image_descriptions = {}
        if descriptions_file.exists():
            with open(descriptions_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and '|' in line:
                        img_name, desc = line.split('|', 1)
                        image_descriptions[img_name.strip()] = desc.strip()
        
        # Load images from each fracture type folder
        seen_images = set()  # Track to avoid duplicates
        for fracture_folder in self.data_dir.iterdir():
            if fracture_folder.is_dir():
                fracture_type = fracture_folder.name
                self.fracture_types.append(fracture_type)
                
                # Use a set to collect unique image paths
                image_files = set()
                for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
                    image_files.update(fracture_folder.glob(ext))
                
                for img_path in image_files:
                    img_path_str = str(img_path)
                    if img_path_str not in seen_images:  # Avoid duplicates
                        seen_images.add(img_path_str)
                        self.images.append(img_path_str)
                        self.labels.append(fracture_type)
                        
                        # Get custom description or use default
                        img_name = img_path.name
                        if img_name in image_descriptions:
                            self.descriptions.append(image_descriptions[img_name])
                        else:
                            self.descriptions.append(f"{fracture_type} fracture on bone x-ray")
        
        self.fracture_types = sorted(set(self.fracture_types))
        
        if len(self.images) == 0:
            print("Error: No images found in data folder!")
            sys.exit(1)
        
        print(f"Loaded {len(self.images)} images")
        print(f"Fracture types: {', '.join(self.fracture_types)}\n")
        
        label_counts = defaultdict(int)
        for label in self.labels:
            label_counts[label] += 1
        
        print("Dataset distribution:")
        for fracture, count in sorted(label_counts.items()):
            print(f"  {fracture}: {count} images")


def load_biomedclip():
    """Load pretrained BioMedCLIP model"""
    print("\nLoading BioMedCLIP model...")
    
    model_name = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
    
    model, _, preprocess = open_clip.create_model_and_transforms(model_name)
    tokenizer = open_clip.get_tokenizer(model_name)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    model.eval()
    
    print(f"Model loaded on: {device}\n")
    return model, preprocess, tokenizer, device


def classify_image(model, preprocess, tokenizer, device, image_path, fracture_types, description=None):
    """Classify a single fracture X-ray"""
    
    image = Image.open(image_path).convert('RGB')
    image_input = preprocess(image).unsqueeze(0).to(device)
    
    text_labels = [description if (description and ftype in description) 
                   else f"{ftype} fracture on bone x-ray"
                   for ftype in fracture_types]
    text_tokens = tokenizer(text_labels).to(device)
    
    with torch.no_grad():
        image_features = model.encode_image(image_input)
        text_features = model.encode_text(text_tokens)
        
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
    
    results = {}
    for fracture_type, prob in zip(fracture_types, similarity[0]):
        results[fracture_type] = prob.item()
    
    return results


def test_model(model, preprocess, tokenizer, device, dataset):
    """Test model on entire dataset"""
    
    print("=" * 80)
    print("TESTING MODEL")
    print("=" * 80 + "\n")
    
    images = dataset.images
    labels = dataset.labels
    descriptions = dataset.descriptions
    fracture_types = dataset.fracture_types
    
    results = []
    correct = 0
    total = 0
    confusion = defaultdict(lambda: defaultdict(int))
    
    print(f"Processing {len(images)} images...\n")
    
    for i, (img_path, true_label, desc) in enumerate(zip(images, labels, descriptions), 1):
        predictions = classify_image(model, preprocess, tokenizer, device, img_path, fracture_types, description=desc)
        
        predicted_label = max(predictions, key=predictions.get)
        predicted_prob = predictions[predicted_label]
        
        is_correct = (predicted_label == true_label)
        if is_correct:
            correct += 1
        total += 1
        
        confusion[true_label][predicted_label] += 1
        
        results.append({
            'image': os.path.basename(img_path),
            'description': desc,
            'true_label': true_label,
            'predicted_label': predicted_label,
            'confidence': predicted_prob,
            'correct': is_correct,
            'predictions': predictions
        })
        
        if i % 5 == 0 or i == len(images):
            acc = (correct / total * 100) if total > 0 else 0
            print(f"Progress: {i}/{len(images)} | Accuracy: {acc:.1f}%")
    
    accuracy = correct / total if total > 0 else 0
    
    return accuracy, results, confusion, fracture_types


def print_results(accuracy, results, confusion, fracture_types):
    """Print test results"""
    
    print("\n" + "=" * 80)
    print("RESULTS")
    print("=" * 80 + "\n")
    
    correct = sum(1 for r in results if r['correct'])
    total = len(results)
    print(f"Overall Accuracy: {accuracy:.2%} ({correct}/{total} correct)\n")
    
    print("Per-Class Accuracy:")
    for fracture_type in fracture_types:
        correct_class = confusion[fracture_type][fracture_type]
        total_class = sum(confusion[fracture_type].values())
        acc = correct_class / total_class if total_class > 0 else 0
        print(f"  {fracture_type:15s}: {acc:6.2%}  ({correct_class}/{total_class})")
    
    print("\nConfusion Matrix:")
    header = "True\\Pred"
    print(f"{header:<15}", end="")
    for pred_type in fracture_types:
        print(f"{pred_type[:10]:>12}", end="")
    print()
    print("-" * (15 + 12 * len(fracture_types)))
    
    for true_type in fracture_types:
        print(f"{true_type[:15]:<15}", end="")
        for pred_type in fracture_types:
            count = confusion[true_type][pred_type]
            print(f"{count:>12}", end="")
        print()
    
    print("\nSample Predictions:")
    for i, result in enumerate(results[:10], 1):
        status = "✓" if result['correct'] else "✗"
        print(f"\n{status} {result['image']}")
        print(f"  Description: {result['description']}")
        print(f"  True: {result['true_label']} | Predicted: {result['predicted_label']} ({result['confidence']:.1%})")


def save_results(accuracy, results, confusion, fracture_types):
    """Save results to files"""
    
    output_path = Path("results")
    output_path.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    results_file = output_path / f"results_{timestamp}.json"
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': timestamp,
            'accuracy': accuracy,
            'total_images': len(results),
            'correct_predictions': sum(1 for r in results if r['correct']),
            'results': results,
            'confusion_matrix': {k: dict(v) for k, v in confusion.items()},
            'fracture_types': fracture_types
        }, f, indent=2)
    
    print(f"\nResults saved to: {results_file}")


def main():
    """Main execution"""
    
    print("\n" + "=" * 80)
    print("BONE FRACTURE CLASSIFICATION TEST")
    print("=" * 80 + "\n")
    
    # Load dataset
    dataset = BoneFractureDataset("data")
    
    # Load model
    model, preprocess, tokenizer, device = load_biomedclip()
    
    # Test
    accuracy, results, confusion, fracture_types = test_model(
        model, preprocess, tokenizer, device, dataset
    )
    
    # Display results
    print_results(accuracy, results, confusion, fracture_types)
    
    # Save results
    save_results(accuracy, results, confusion, fracture_types)
    
    print("\n" + "=" * 80)
    print(f"TEST COMPLETE | Final Accuracy: {accuracy:.2%}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()