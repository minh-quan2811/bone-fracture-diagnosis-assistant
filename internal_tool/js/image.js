// ─── IMAGE ───────────────────────────────────────────────────────────────────
// Loads images onto the canvas and draws YOLO bounding-box annotations.

import { state, BOX_COLORS } from './state.js';
import { updateCounters, showToast } from './ui.js';
import { renderTaskCards } from './annotations.js';
import { renderThumbs } from './thumbnails.js';

export async function loadImage(index) {
  if (!state.imageFiles.length) return;
  state.currentIndex = index;
  updateCounters(state.imageFiles, state.currentIndex);

  // Always clear stale generated VQA when switching images.
  // This is the key guard: _collectFromDOM() in saveCurrentImage reads
  // window._generatedVQA, so if it's left over from a previous image it
  // will corrupt the newly-loaded image's data.
  window._generatedVQA = null;

  const file = state.imageFiles[index];
  document.getElementById('imgFilename').textContent    = file.name;
  document.getElementById('saveBtn').disabled           = false;
  document.getElementById('btnPrev').disabled           = index === 0;
  document.getElementById('btnNext').disabled           = index === state.imageFiles.length - 1;

  // Highlight active thumbnail
  document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === index));
  const activeThumb = document.querySelector('.thumb.active');
  if (activeThumb) activeThumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

  // Draw image + annotations
  const img = new Image();
  const url = URL.createObjectURL(file);
  console.log('Loading image:', file.name);

  img.onload = async () => {
    URL.revokeObjectURL(url);
    const canvas = document.getElementById('imgCanvas');
    const area   = document.getElementById('imageArea');
    const maxW   = area.clientWidth  - 20;
    const maxH   = area.clientHeight - 20;
    const scale  = Math.min(maxW / img.width, maxH / img.height, 1);
    canvas.width  = img.width  * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Overlay label boxes
    const labelKey  = file.name.replace(/\.[^.]+$/, '');
    const labelFile = state.labelFiles[labelKey];
    if (labelFile) {
      const txt = await readText(labelFile);
      drawAnnotations(ctx, txt, canvas.width, canvas.height);
    }

    document.getElementById('emptyState').style.display = 'none';
    canvas.style.display = 'block';
  };

  img.onerror = () => {
    console.error('Error loading image:', file.name);
    showToast(`Error loading ${file.name}`, 'warn');
  };

  img.src = url;

  renderTaskCards(file.name);
  state.dirty = false;
}

// ── Bounding-box overlay ──────────────────────────────────────────────────────

function drawAnnotations(ctx, labelText, W, H) {
  const lines = labelText.split('\n').filter(Boolean);
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/).map(Number);
    if (parts.length < 5) return;
    const [cls, cx, cy, bw, bh] = parts;
    const x = (cx - bw / 2) * W;
    const y = (cy - bh / 2) * H;
    const w = bw * W;
    const h = bh * H;
    const color = BOX_COLORS[cls % BOX_COLORS.length];

    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.strokeRect(x, y, w, h);

    const label = state.classNames[cls] || ('cls_' + cls);
    ctx.font = 'bold 11px IBM Plex Mono, monospace';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 16, tw + 8, 16);
    ctx.fillStyle = '#000';
    ctx.fillText(label, x + 4, y - 4);
  });
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function readText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}