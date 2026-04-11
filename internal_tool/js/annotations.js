// ─── ANNOTATIONS ─────────────────────────────────────────────────────────────
// Renders task cards, tracks dirty state, and saves annotations.

import { state, TASKS } from './state.js';
import { setStatus } from './ui.js';
import { saveCSVFile } from './csv.js';

// ── Task cards ────────────────────────────────────────────────────────────────

export function renderTaskCards(fname) {
  const existing = state.csvData[fname] || {};
  const scroll   = document.getElementById('tasksScroll');
  scroll.innerHTML = '';

  TASKS.forEach(task => {
    const data   = existing[task.key] || { q: '', a: '', question_type: '' };
    const filled = !!(data.q || data.a);

    const card = document.createElement('div');
    card.className = 'task-card';
    card.style.setProperty('--task-color', task.color);

    // question_type selector row — only for vqa tasks
    const typeRow = task.hasType ? `
      <div class="field-label">question type</div>
      <select class="field-input type-select" id="type-${task.key}">
        <option value="">— select type —</option>
        <option value="presence"       ${data.question_type === 'presence'       ? 'selected' : ''}>presence</option>
        <option value="location"       ${data.question_type === 'location'       ? 'selected' : ''}>location</option>
        <option value="classification" ${data.question_type === 'classification' ? 'selected' : ''}>classification</option>
        <option value="characteristic" ${data.question_type === 'characteristic' ? 'selected' : ''}>characteristic</option>
      </select>
    ` : '';

    card.innerHTML = `
      <div class="task-header" data-task-key="${task.key}">
        <div class="task-dot"></div>
        <div class="task-name">${task.label}</div>
        <div class="task-badge ${filled ? 'filled' : ''}" id="badge-${task.key}">${filled ? 'filled' : 'empty'}</div>
        <div class="task-toggle">▾</div>
      </div>
      <div class="task-body" id="body-${task.key}">
        ${typeRow}
        <div class="field-label">question</div>
        <textarea class="field-input q-input" id="q-${task.key}" placeholder="${task.defaultQ}">${data.q || ''}</textarea>
        <div class="field-label">answer</div>
        <textarea class="field-input a-input" id="a-${task.key}" placeholder="type the answer here...">${data.a || ''}</textarea>
      </div>
    `;

    scroll.appendChild(card);

    // Toggle expand/collapse
    const header = card.querySelector('.task-header');
    header.addEventListener('click', () => {
      const body   = card.querySelector('.task-body');
      const toggle = header.querySelector('.task-toggle');
      body.classList.toggle('expanded');
      toggle.textContent = body.classList.contains('expanded') ? '▾' : '▸';
    });

    // Track dirty state on textarea input
    card.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('input', () => {
        state.dirty = true;
        updateBadge(task.key);
      });
    });

    // Track dirty state on select change
    if (task.hasType) {
      const sel = card.querySelector(`#type-${task.key}`);
      if (sel) sel.addEventListener('change', () => { state.dirty = true; });
    }
  });
}

function updateBadge(taskKey) {
  const q      = document.getElementById('q-' + taskKey)?.value || '';
  const a      = document.getElementById('a-' + taskKey)?.value || '';
  const filled = !!(q || a);
  const badge  = document.getElementById('badge-' + taskKey);
  if (badge) {
    badge.textContent = filled ? 'filled' : 'empty';
    badge.className   = 'task-badge' + (filled ? ' filled' : '');
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveCurrentImage(silent = false) {
  if (!state.imageFiles.length) return;
  const file  = state.imageFiles[state.currentIndex];
  const fname = file.name;

  if (!state.csvData[fname]) state.csvData[fname] = {};

  let anyFilled = false;
  TASKS.forEach(task => {
    const q    = (document.getElementById('q-'    + task.key)?.value || '').trim();
    const a    = (document.getElementById('a-'    + task.key)?.value || '').trim();
    const type = task.hasType
      ? (document.getElementById('type-' + task.key)?.value || '').trim()
      : '';

    if (q || a) {
      state.csvData[fname][task.key] = { q, a, question_type: type };
      anyFilled = true;
    } else {
      delete state.csvData[fname][task.key];
    }
  });

  if (!Object.keys(state.csvData[fname]).length) delete state.csvData[fname];

  state.dirty = false;
  await saveCSVFile();
  updateThumbCount(state.currentIndex, fname);

  if (!silent) setStatus('last saved: ' + fname, 'ok');
}

// ── Thumbnail count update ────────────────────────────────────────────────────

export function updateThumbCount(index, fname) {
  const tasks = state.csvData[fname] ? Object.keys(state.csvData[fname]).length : 0;
  const thumb = document.querySelector('.thumb[data-index="' + index + '"]');
  const el    = thumb?.querySelector('.thumb-task-count');
  if (el) el.textContent = `${tasks}/3`;
}