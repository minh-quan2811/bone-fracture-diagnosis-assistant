// ─── NAVIGATION ──────────────────────────────────────────────────────────────
// Handles prev / next image navigation.

import { state } from './state.js';
import { saveCurrentImage } from './annotations.js';
import { loadImage } from './image.js';

export async function navigate(dir) {
  if (window._aiGenerating) return;

  if (state.dirty) await saveCurrentImage(true);
  const next = state.currentIndex + dir;
  if (next >= 0 && next < state.imageFiles.length) loadImage(next);
}