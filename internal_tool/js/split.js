// ─── SPLIT ───────────────────────────────────────────────────────────────────
// Handles switching between train / valid / test splits.

import { state } from './state.js';
import { setStatus } from './ui.js';
import { loadCSV } from './csv.js';
import { saveCurrentImage } from './annotations.js';
import { loadImage } from './image.js';
import { renderThumbs } from './thumbnails.js';
import { updateCounters } from './ui.js';

export async function switchSplit(split) {
  if (state.dirty) await saveCurrentImage(true);

  state.split = split;
  document.querySelectorAll('.split-tab').forEach(t => {
    t.classList.toggle('active', t.textContent === split);
  });

  if (!state.allFiles.length) return;

  // Filter files belonging to this split
  const splitFiles = state.allFiles.filter(f => {
    if (f.webkitRelativePath && (
      f.webkitRelativePath.includes('/' + split + '/') ||
      f.webkitRelativePath.startsWith(split + '/')
    )) {
      return true;
    }
    return state.fileSplits[f.name] === split;
  });
  console.log(`Files for ${split} split:`, splitFiles.length);

  // Separate images and label files
  const imgExts = ['.jpg', '.jpeg', '.png', '.bmp', '.webp'];
  state.imageFiles = splitFiles
    .filter(f => imgExts.some(ext => f.name.toLowerCase().endsWith(ext)))
    .sort((a, b) => a.name.localeCompare(b.name));
  console.log(`Images found for ${split}:`, state.imageFiles.length);
  if (state.imageFiles.length) console.log('First image:', state.imageFiles[0].name);

  state.labelFiles = {};
  splitFiles
    .filter(f => f.name.endsWith('.txt'))
    .forEach(f => { state.labelFiles[f.name.replace('.txt', '')] = f; });

  // ── Load CSV data for this split ──────────────────────────────────────────

  const handle = state.csvFileHandles[split];

  if (handle) {
    // Re-read from the actual file handle — this reflects the latest saved state
    try {
      const file = await handle.getFile();
      state.csvDataBySplit[split] = {};   // reset only this split's data
      await loadCSV(file, split);
      setStatus(`loaded ${state.imageFiles.length} images with ${Object.keys(state.csvData).length} annotated`, 'ok');
    } catch (err) {
      console.error('Error reading CSV from handle:', err);
      // Fall through with whatever is in memory
      setStatus(`loaded ${state.imageFiles.length} images`, 'ok');
    }
  } else if (!state.splitLoaded[split]) {
    // First visit without a handle — try the stale File object
    state.csvDataBySplit[split] = {};
    const csvFile = splitFiles.find(f => f.name === split + '_annotations.csv');
    if (csvFile) {
      await loadCSV(csvFile, split);
      setStatus(`loaded ${state.imageFiles.length} images with ${Object.keys(state.csvData).length} annotated`, 'ok');
    } else {
      setStatus(`loaded ${state.imageFiles.length} images`, 'ok');
    }
  } else {
    // Already loaded, no handle — keep in-memory data (it's the source of truth)
    setStatus(`loaded ${state.imageFiles.length} images with ${Object.keys(state.csvData).length} annotated`, 'ok');
  }

  state.splitLoaded[split] = true;

  state.currentIndex = 0;
  updateCounters(state.imageFiles, state.currentIndex);
  renderThumbs();

  if (state.imageFiles.length) {
    loadImage(0);
  } else {
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('imgCanvas').style.display  = 'none';
    document.getElementById('tasksScroll').innerHTML    = '';
    document.getElementById('saveBtn').disabled         = true;
    setStatus(`no images found in ${split}/images/`, 'warn');
  }
}