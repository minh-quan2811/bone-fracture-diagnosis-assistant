// ─── THUMBNAILS ──────────────────────────────────────────────────────────────
// Renders the horizontal thumbnail strip below the main image.

import { state } from './state.js';
import { saveCurrentImage } from './annotations.js';
import { loadImage } from './image.js';

export function renderThumbs() {
  const strip = document.getElementById('thumbStrip');
  strip.innerHTML = '';

  state.imageFiles.forEach((file, i) => {
    const thumb = document.createElement('div');
    thumb.className    = 'thumb' + (i === 0 ? ' active' : '');
    thumb.dataset.index = i;
    thumb.onclick = async () => {
      if (state.dirty) await saveCurrentImage(true);
      loadImage(i);
    };

    const tasks     = state.csvData[file.name] ? Object.keys(state.csvData[file.name]).length : 0;
    thumb.innerHTML = `
      <div class="thumb-content">
        <div class="thumb-task-count">${tasks}/3</div>
        <div class="thumb-index">#${i + 1}</div>
      </div>
    `;
    strip.appendChild(thumb);
  });
}