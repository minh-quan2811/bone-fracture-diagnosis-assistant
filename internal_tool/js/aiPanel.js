// ─── AI PANEL ────────────────────────────────────────────────────────────────
// Wires up the AI assist panel declared in app.html.

import { generateAnnotations, setActiveProvider, getActiveProvider, PROVIDERS } from './ai.js';
import { TASKS } from './state.js';
import { showToast } from './ui.js';

// ── Init ──────────────────────────────────────────────────────────────────────

export function initAIPanel() {
  _renderProviderTabs();
  _initTypePills();
  window.aiGenerate = handleGenerate;
  window.aiClear    = handleClear;
}

// ── Provider tabs ─────────────────────────────────────────────────────────────

function _renderProviderTabs() {
  const container = document.getElementById('aiProviderTabs');
  if (!container) return;

  Object.values(PROVIDERS).forEach(p => {
    const btn = document.createElement('button');
    btn.className        = 'ai-provider-tab' + (p.id === getActiveProvider() ? ' active' : '');
    btn.textContent      = p.label;
    btn.dataset.provider = p.id;
    btn.onclick          = () => _switchProvider(p.id);
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

// ── Type pill selector with polarity controls ─────────────────────────────────

const MAX_SELECTED = 2;

function _initTypePills() {
  const pills = document.querySelectorAll('#aiTypePills .type-pill input');

  pills.forEach(cb => {
    cb.addEventListener('change', () => {
      _enforceLimit(pills);
      _updateHint(pills);
    });
  });

  // Initialize polarity toggle listeners
  document.querySelectorAll('.polarity-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      const pill = e.target.closest('.type-pill');
      const checkbox = pill.querySelector('input[type="checkbox"]');
      
      // Only toggle polarity if this type is selected
      if (checkbox.checked) {
        const currentPolarity = toggle.dataset.polarity || 'positive';
        const newPolarity = currentPolarity === 'positive' ? 'negative' : 'positive';
        toggle.dataset.polarity = newPolarity;
        toggle.textContent = newPolarity === 'positive' ? '+' : '−';
        toggle.title = `Answer polarity: ${newPolarity}`;
      }
    });
  });

  _updateHint(pills);
}

// If a third checkbox is ticked, uncheck it immediately
function _enforceLimit(pills) {
  const checked = [...pills].filter(cb => cb.checked);

  if (checked.length > MAX_SELECTED) {
    // The most recently changed one is the extra — uncheck it
    for (const cb of pills) {
      if (cb.checked && !cb._wasChecked) {
        cb.checked = false;
        break;
      }
    }
  }

  // Store current state for next change comparison
  pills.forEach(cb => { cb._wasChecked = cb.checked; });

  // Disable uncheckable pills (those not checked when limit reached)
  const nowChecked = [...pills].filter(cb => cb.checked);
  pills.forEach(cb => {
    const pill = cb.closest('.type-pill');
    pill.classList.toggle(
      'disabled',
      nowChecked.length >= MAX_SELECTED && !cb.checked
    );
    
    // Show/hide polarity toggle based on selection
    const toggle = pill.querySelector('.polarity-toggle');
    if (toggle) {
      toggle.style.display = cb.checked ? 'inline-flex' : 'none';
      // Reset to positive when deselected
      if (!cb.checked) {
        toggle.dataset.polarity = 'positive';
        toggle.textContent = '+';
      }
    }
  });
}

function _updateHint(pills) {
  const count = [...pills].filter(cb => cb.checked).length;
  const hint  = document.getElementById('aiTypeHint');
  if (!hint) return;
  hint.textContent = `${count} / ${MAX_SELECTED}`;
  hint.className   = 'ai-type-hint ' + (count === MAX_SELECTED ? 'ok' : 'warn');
}

// Returns array of {type, polarity} configs, or null if not exactly 2
function _getSelectedTypeConfigs() {
  const pills = document.querySelectorAll('#aiTypePills .type-pill');
  const configs = [];
  
  pills.forEach(pill => {
    const checkbox = pill.querySelector('input[type="checkbox"]');
    if (checkbox.checked) {
      const toggle = pill.querySelector('.polarity-toggle');
      configs.push({
        type: checkbox.value,
        polarity: toggle?.dataset.polarity || 'positive'
      });
    }
  });
  
  return configs.length === MAX_SELECTED ? configs : null;
}

// ── Generate handler ──────────────────────────────────────────────────────────

async function handleGenerate() {
  const obs = document.getElementById('aiObservation')?.value?.trim();
  if (!obs) {
    setAIStatus('enter an observation first', 'warn');
    return;
  }

  const typeConfigs = _getSelectedTypeConfigs();
  if (!typeConfigs) {
    setAIStatus('select exactly 2 vqa types first', 'warn');
    return;
  }

  setLoading(true);
  const polarityDesc = typeConfigs.map(c => `${c.type}(${c.polarity.charAt(0)})`).join(', ');
  setAIStatus(`calling ${PROVIDERS[getActiveProvider()].label}... [${polarityDesc}]`, 'dim');

  try {
    const result = await generateAnnotations(obs, typeConfigs);
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
    const q    = document.getElementById('q-'    + task.key);
    const a    = document.getElementById('a-'    + task.key);
    const type = document.getElementById('type-' + task.key);
    if (q)    { q.value    = ''; q.dispatchEvent(new Event('input')); }
    if (a)    { a.value    = ''; a.dispatchEvent(new Event('input')); }
    if (type) { type.value = ''; }
  });
  setAIStatus('fields cleared', 'dim');
}

// ── Fill task fields ──────────────────────────────────────────────────────────

function fillTaskFields(result) {
  // vqa is an array of 2 — map index to vqa_1 / vqa_2
  result.vqa.forEach((entry, i) => {
    const key = 'vqa_' + (i + 1);
    const qEl = document.getElementById('q-'    + key);
    const aEl = document.getElementById('a-'    + key);
    const tEl = document.getElementById('type-' + key);

    if (qEl) { qEl.value = entry.question     || ''; qEl.dispatchEvent(new Event('input')); animateField(qEl); }
    if (aEl) { aEl.value = entry.answer        || ''; aEl.dispatchEvent(new Event('input')); animateField(aEl); }
    if (tEl) { tEl.value = entry.question_type || ''; animateField(tEl); }
    
    // Store polarity for reference (optional - can be used for visual indicators)
    if (qEl) qEl.dataset.polarity = entry.polarity || 'positive';
    if (aEl) aEl.dataset.polarity = entry.polarity || 'positive';
  });

  // report
  const qEl = document.getElementById('q-report');
  const aEl = document.getElementById('a-report');
  if (qEl) { qEl.value = result.report.question || ''; qEl.dispatchEvent(new Event('input')); animateField(qEl); }
  if (aEl) { aEl.value = result.report.answer   || ''; aEl.dispatchEvent(new Event('input')); animateField(aEl); }
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