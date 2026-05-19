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
    const count = state.csvData[file.name]?.length || 0;
    const generatedClass = count > 0 ? 'generated' : 'not-generated';
    
    thumb.className    = `thumb ${generatedClass}` + (i === 0 ? ' active' : '');
    thumb.dataset.index = i;
    thumb.onclick = async () => {
      // Block thumbnail clicks while AI generation is in progress
      if (window._aiGenerating) return;

      // Save current image first (using the current index)
      if (state.dirty) await saveCurrentImage(true, state.currentIndex);
      
      // image.js clears window._generatedVQA on every loadImage call,
      // so no need to clear it here.

      // Load the new image
      loadImage(i);
      
      // Reset dirty flag after loading
      state.dirty = false;
    };

    thumb.innerHTML = `
      <div class="thumb-content">
        <div class="thumb-task-count">${count}</div>
        <div class="thumb-index">#${i + 1}</div>
      </div>
    `;
    strip.appendChild(thumb);
  });
}