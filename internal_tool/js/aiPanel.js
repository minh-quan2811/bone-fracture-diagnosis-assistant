// ─── AI PANEL ────────────────────────────────────────────────────────────────
// Wires up the AI assist panel that lives in app.html.
// HTML markup is declared statically in app.html — this module only handles
// behaviour: provider switching, generate / clear actions, field filling.

import { generateAnnotations, setActiveProvider, getActiveProvider, PROVIDERS } from './ai.js';
import { TASKS } from './state.js';
import { showToast, setStatus } from './ui.js';

// ── Init ──────────────────────────────────────────────────────────────────────

export function initAIPanel() {
  _renderProviderTabs();
  window.aiGenerate = handleGenerate;
  window.aiClear    = handleClear;
}

// ── Provider tabs ─────────────────────────────────────────────────────────────

function _renderProviderTabs() {
  const container = document.getElementById('aiProviderTabs');
  if (!container) return;

  Object.values(PROVIDERS).forEach(p => {
    const btn = document.createElement('button');
    btn.className   = 'ai-provider-tab' + (p.id === getActiveProvider() ? ' active' : '');
    btn.textContent = p.label;
    btn.dataset.provider = p.id;
    btn.onclick = () => _switchProvider(p.id);
    container.appendChild(btn);
  });

  _updateModelLabel();
}

function _switchProvider(id) {
  setActiveProvider(id);
  document.querySelectorAll('.ai-provider-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === id);
  });
  _updateModelLabel();
  setAIStatus('provider: ' + PROVIDERS[id].label, 'dim');
}

function _updateModelLabel() {
  const el = document.getElementById('aiModelLabel');
  if (el) el.textContent = PROVIDERS[getActiveProvider()].model;
}

// ── Generate handler ──────────────────────────────────────────────────────────

async function handleGenerate() {
  const obs = document.getElementById('aiObservation')?.value?.trim();
  if (!obs) {
    setAIStatus('enter an observation first', 'warn');
    return;
  }

  setLoading(true);
  setAIStatus(`calling ${PROVIDERS[getActiveProvider()].label}...`, 'dim');

  try {
    const result = await generateAnnotations(obs);
    fillTaskFields(result);
    setAIStatus('✓ fields populated — review & save', 'ok');
    showToast('annotations generated', 'success');

    const { state } = await import('./state.js');
    state.dirty = true;
  } catch (err) {
    console.error('AI error:', err);
    setAIStatus(err.message, 'error');
    showToast('AI error — see panel', 'error');
  } finally {
    setLoading(false);
  }
}

// ── Clear handler ─────────────────────────────────────────────────────────────

function handleClear() {
  TASKS.forEach(task => {
    const q = document.getElementById('q-' + task.key);
    const a = document.getElementById('a-' + task.key);
    if (q) { q.value = ''; q.dispatchEvent(new Event('input')); }
    if (a) { a.value = ''; a.dispatchEvent(new Event('input')); }
  });
  setAIStatus('fields cleared', 'dim');
}

// ── Fill task fields ──────────────────────────────────────────────────────────

function fillTaskFields(result) {
  for (const taskKey of ['vqa', 'report', 'rationale']) {
    const data = result[taskKey];
    if (!data) continue;

    const qEl = document.getElementById('q-' + taskKey);
    const aEl = document.getElementById('a-' + taskKey);

    if (qEl) { qEl.value = data.question || ''; qEl.dispatchEvent(new Event('input')); animateField(qEl); }
    if (aEl) { aEl.value = data.answer   || ''; aEl.dispatchEvent(new Event('input')); animateField(aEl); }
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function setLoading(on) {
  const btn     = document.getElementById('aiGenerateBtn');
  const text    = document.getElementById('aiBtnText');
  const spinner = document.getElementById('aiBtnSpinner');
  if (!btn) return;
  btn.disabled     = on;
  text.textContent = on ? 'generating...' : 'generate';
  spinner?.classList.toggle('hidden', !on);
}

function setAIStatus(msg, level = 'dim') {
  const el = document.getElementById('aiStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'ai-status ai-status-' + level;
}

function animateField(el) {
  el.classList.remove('ai-filled');
  void el.offsetWidth;
  el.classList.add('ai-filled');
}