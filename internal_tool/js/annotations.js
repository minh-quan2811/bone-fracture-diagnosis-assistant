// ─── ANNOTATIONS ─────────────────────────────────────────────────────────────
// Renders task cards, tracks dirty state, and saves annotations.

import { state } from './state.js';
import { setStatus } from './ui.js';
import { saveCSVFile } from './csv.js';

// ── Task cards (shown before generation) ─────────────────────────────────────

export function renderTaskCards(fname) {
  const existing = state.csvData[fname];
  const scroll   = document.getElementById('tasksScroll');
  scroll.innerHTML = '';

  // Clear any previously generated VQA
  window._generatedVQA = null;

  if (!existing || !existing.length) {
    scroll.innerHTML = `
      <div class="empty-state" style="padding:32px;text-align:center;opacity:.5;font-size:13px">
        use ai assist panel to generate vqa pairs<br>or they will appear after generation
      </div>`;
    return;
  }

  // Sort existing entries into consistent order
  const TYPE_ORDER = ['modality', 'presence', 'location', 'classification', 'anatomy', 'knowledge', 'characteristic', 'plane'];
  const sortedExisting = [...existing].sort((a, b) => {
    const indexA = TYPE_ORDER.indexOf(a.question_type);
    const indexB = TYPE_ORDER.indexOf(b.question_type);
    return indexA - indexB;
  });

  // Render saved entries as read-only preview cards
  const TYPE_COLORS = {
    modality:       '#64748b',
    presence:       '#00d4aa',
    location:       '#00b4d8',
    classification: '#a855f7',
    anatomy:        '#06b6d4',
    knowledge:      '#ec4899',
    characteristic: '#f59e0b',
    plane:          '#10b981',
  };

  sortedExisting.forEach((entry, i) => {
    const color = TYPE_COLORS[entry.question_type] || '#0099ff';
    const card  = document.createElement('div');
    card.className = 'task-card';
    card.style.setProperty('--task-color', color);

    card.innerHTML = `
      <div class="task-header" style="cursor:pointer">
        <div class="task-dot"></div>
        <div class="task-name">${entry.question_type}
          <span style="font-size:10px;opacity:.6;margin-left:4px">[${entry.answer_type || 'open'}]</span>
          <span style="font-size:10px;margin-left:4px;color:${entry.polarity === 'negative' ? 'var(--warn)' : 'var(--accent)'}">
            ${entry.polarity === 'negative' ? '−neg' : '+pos'}
          </span>
        </div>
        <div class="task-badge filled">saved</div>
        <div class="task-toggle">▸</div>
      </div>
      <div class="task-body">
        <div class="field-label">question</div>
        <textarea class="field-input q-input" id="saved-q-${i}">${entry.question}</textarea>
        <div class="field-label">answer</div>
        <textarea class="field-input a-input" id="saved-a-${i}">${entry.answer}</textarea>
      </div>
    `;

    card.querySelector('.task-header').addEventListener('click', () => {
      const body   = card.querySelector('.task-body');
      const toggle = card.querySelector('.task-toggle');
      body.classList.toggle('expanded');
      toggle.textContent = body.classList.contains('expanded') ? '▾' : '▸';
    });

    // Track edits — update existing entries
    card.querySelector(`#saved-q-${i}`).addEventListener('input', e => {
      existing[i].question = e.target.value;
      state.dirty = true;
    });
    card.querySelector(`#saved-a-${i}`).addEventListener('input', e => {
      existing[i].answer = e.target.value;
      state.dirty = true;
    });

    scroll.appendChild(card);
  });

  // Restore generated VQA for saving
  window._generatedVQA = existing;
  
  updateThumbCount(state.currentIndex, fname);
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveCurrentImage(silent = false, indexOverride = null) {
  if (!state.imageFiles.length) return;
  const index = indexOverride !== null ? indexOverride : state.currentIndex;
  const file  = state.imageFiles[index];
  const fname = file.name;

  // Only save if there's data in state.csvData (don't use window._generatedVQA during navigation)
  if (!state.csvData[fname] || state.csvData[fname].length === 0) {
    // Nothing to save
    if (!silent) setStatus('nothing to save', 'warn');
    return;
  }

  // Collect latest values from DOM textareas if they exist
  const vqaList = state.csvData[fname];
  const domEntries = _collectFromDOM(vqaList.length);
  if (domEntries.length > 0) {
    state.csvData[fname] = domEntries;
  }

  state.dirty = false;
  await saveCSVFile();
  updateThumbCount(index, fname);
  if (!silent) setStatus('last saved: ' + fname, 'ok');
}

/** Read current textarea values from DOM-rendered VQA cards */
function _collectFromDOM(count) {
  const entries = [];
  for (let i = 0; i < count; i++) {
    const q = document.getElementById(`vqa-q-${i}`) || document.getElementById(`saved-q-${i}`);
    const a = document.getElementById(`vqa-a-${i}`) || document.getElementById(`saved-a-${i}`);
    if (q && a && window._generatedVQA?.[i]) {
      entries.push({
        ...window._generatedVQA[i],
        question: q.value,
        answer:   a.value,
      });
    }
  }
  return entries;
}

// ── Thumbnail count update ────────────────────────────────────────────────────

export function updateThumbCount(index, fname) {
  const count = state.csvData[fname]?.length || 0;
  const thumb = document.querySelector(`.thumb[data-index="${index}"]`);
  const el    = thumb?.querySelector('.thumb-task-count');
  if (el) el.textContent = `${count}`;
  
  // Update thumbnail styling based on generated state
  if (thumb) {
    thumb.classList.toggle('generated', count > 0);
    thumb.classList.toggle('not-generated', count === 0);
  }
}