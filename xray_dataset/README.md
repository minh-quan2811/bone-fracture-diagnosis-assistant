# VLM Annotator

An internal browser-based tool for annotating medical X-ray images with structured question-answer pairs for VLM (Vision-Language Model) training datasets.

---

## What it does

- Lets you write **Visual QA**, **Radiology Report**, and **Rationale Diagnosis** annotations per image
- Saves annotations to a CSV file directly in your dataset folder
- Optionally uses **Gemini AI** to auto-generate annotation drafts from your observations

---

## Setup

### 1. Configure your Gemini API key

Copy the example config file and add your key:

```bash
cp js/config.example.js js/config.js
```

Then open `js/config.js` and replace the placeholder:

```js
export const GEMINI_API_KEY = 'your-key-here';
```

Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

> `js/config.js` is gitignored — it will never be committed.

### 2. Open with a local server

#### 2.1 **Using VS Code Live Server:**
1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `app.html` → **Open with Live Server**

#### 2.2 **Using Python (Optional):**
```bash
python -m http.server 8000
# then open http://localhost:8000/app.html
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

| image_path | task_type | question | answer |
|---|---|---|---|
| train/images/img001.jpg | vqa | What type of fracture is present? | Transverse fracture of the mid-shaft femur... |
| train/images/img001.jpg | report | Generate a radiology report. | FINDINGS: ... IMPRESSION: ... |
| train/images/img001.jpg | rationale | Why is this finding classified as shown? | The cortical disruption is visible... |

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `←` / `↑` | Previous image |
| `→` / `↓` | Next image |
| `Ctrl+S` / `Cmd+S` | Save current image |

---

## Notes

- Annotations auto-save when navigating between images
- Switching splits (train/valid/test) preserves all unsaved changes
- The tool runs entirely in the browser — no backend, no data leaves your machine