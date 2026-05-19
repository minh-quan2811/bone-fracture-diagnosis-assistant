# VLM Annotator

An internal browser-based tool for annotating medical X-ray images with structured question-answer pairs for VLM (Vision-Language Model) training datasets.

---

## What it does

- Lets you write **Visual QA** annotations per image with 7 type of questions including **modality, presence, location, classification, anatomy, knowledge, characteristic,  plane**
- Polarity of **positive** and **negative** answer.
- Saves annotations to a CSV file directly in your dataset folder
- Uses **Gemini** or **OpenRouter** to auto-generate annotation drafts — switchable in the UI

## Requirements

- **Node.js 18+** (for the local proxy server)
- An OpenRouter account **or** a Google AI Studio account (or both)

---

## Setup

### 1. Install dependencies

```bash
npm install
npm install @openrouter/sdk
```

### 2. Configure your API keys

Copy the example env file:

```bash
cp .env.example .env
```

Then open `.env` and fill in the values you need:

```env
# Get a free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Get a free key at: https://openrouter.ai/workspaces/default/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Start the server

```bash
node server.js
```

You will see:

```
VLM Annotator running at http://localhost:8000
```

---

## Dataset structure

The tool expects a standard YOLOv8 layout:

```
dataset/
  train/
    images/
    labels/
    train_annotations.csv     ← auto-created
  valid/
    images/
    labels/
    valid_annotations.csv     ← auto-created
  test/
    images/
    labels/
    test_annotations.csv      ← auto-created
  data.yaml                   ← class names read from here
```

---

## Annotation output

Each CSV has four columns:

| image_path | task_type | polarity | question_type | answer_type | question | answer|
|---|---|---|---|---|---|---|
| train/images/1.jpg |	vqa	| positive | presence |	closed |	Does this image show an oblique fracture of the distal tibia? |	yes |
| train/images/1.jpg |	vqa |	negative |	characteristic |	closed |	Is the finding here consistent with anatomical alignment? |	no |
| train/images/1.jpg |	vqa |	positive |	location |	open |	In what part of the image is the fracture situated? |	femur shaft |

---

## Models used

| Provider | Model | Notes |
|---|---|---|
| Google Gemini | [Gemini models](https://ai.google.dev/gemini-api/docs/pricing) | Free tier available |
| OpenRouter | [OpenRouter models](https://openrouter.ai/models) | Free tier available |

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `←` / `↑` | Previous image |
| `→` / `↓` | Next image |
| `Ctrl+S` | Save current image |

---

## Notes

- Annotations auto-save when navigating between images
- Switching splits (train/valid/test) preserves all unsaved changes