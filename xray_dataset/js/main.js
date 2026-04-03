// ─── MAIN ────────────────────────────────────────────────────────────────────
// Entry point. Imports all modules and wires up global event listeners.

import { state } from './state.js';
import { showLoadModal, hideLoadModal, showToast } from './ui.js';
import { loadDatasetFolder, handleFolderLoad } from './loader.js';
import { switchSplit } from './split.js';
import { loadImage } from './image.js';
import { saveCurrentImage } from './annotations.js';
import { navigate } from './navigation.js';
import { initAIPanel } from './aiPanel.js';

// ── Expose to inline HTML handlers ───────────────────────────────────────────
// (onclick="..." attributes in app.html need these on window)

window.showLoadModal     = showLoadModal;
window.hideLoadModal     = hideLoadModal;
window.loadDatasetFolder = loadDatasetFolder;
window.switchSplit       = switchSplit;
window.navigate          = navigate;
window.saveCurrentImage  = saveCurrentImage;
window.handleFolderLoad  = handleFolderLoad;   // used by <input onchange>

// ── Init AI panel ─────────────────────────────────────────────────────────────

initAIPanel();

// ── Keyboard navigation ───────────────────────────────────────────────────────

document.addEventListener('keydown', async e => {
  if (e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')    navigate(-1);
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  navigate(1);
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    await saveCurrentImage();
  }
});

// ── Drag-zone hint (folder drag not supported, click only) ───────────────────

const dz = document.getElementById('dragZone');
if (dz) {
  dz.addEventListener('dragover',  e  => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', ()  => dz.classList.remove('drag-over'));
  dz.addEventListener('drop',      e  => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    showToast('please use the click button to select folder', '');
  });
}

// ── Auto-open modal on page load ──────────────────────────────────────────────

setTimeout(showLoadModal, 300);