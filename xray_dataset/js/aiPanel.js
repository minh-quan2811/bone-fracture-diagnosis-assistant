// ─── AI PANEL ────────────────────────────────────────────────────────────────
// Renders the Gemini prompt panel and wires up the generate action.
// Sits above the task cards in the right panel.

import { generateAnnotations } from './gemini.js';
import { TASKS }               from './state.js';
import { showToast, setStatus } from './ui.js';

// ── Inject panel HTML ─────────────────────────────────────────────────────────

export function initAIPanel() {
  const leftPanel  = document.querySelector('.left-panel');
  const thumbStrip = document.getElementById('thumbStrip');

  const panel = document.createElement('div');
  panel.id        = 'aiPanel';
  panel.className = 'ai-panel';
  panel.innerHTML = `
    <div class="ai-panel-header">
      <span class="ai-panel-icon">✦</span>
      <span class="ai-panel-title">gemini assist</span>
      <span class="ai-panel-model">gemini-2.5-flash</span>
    </div>
    <div class="ai-panel-body">
      <textarea
        id="aiObservation"
        class="field-input ai-observation"
        placeholder="describe what you see — e.g. transverse fracture mid-shaft femur, moderate displacement, no comminution..."
      ></textarea>
      <div class="ai-actions">
        <button class="ai-generate-btn" id="aiGenerateBtn" onclick="window.aiGenerate()">
          <span id="aiBtnText">generate</span>
          <span id="aiBtnSpinner" class="ai-spinner hidden">⟳</span>
        </button>
        <button class="ai-clear-btn" onclick="window.aiClear()" title="Clear all task fields">
          clear
        </button>
      </div>
    </div>
    <div class="ai-status" id="aiStatus"></div>
  `;

  // Insert between image area and thumb strip
  leftPanel.insertBefore(panel, thumbStrip);

  // Wire up global handlers (called from onclick attributes)
  window.aiGenerate = handleGenerate;
  window.aiClear    = handleClear;
}

// ── Generate handler ──────────────────────────────────────────────────────────

async function handleGenerate() {
  const obs = document.getElementById('aiObservation')?.value?.trim();
  if (!obs) {
    setAIStatus('enter an observation first', 'warn');
    return;
  }

  setLoading(true);
  setAIStatus('calling gemini...', 'dim');

  try {
    const result = await generateAnnotations(obs);
    fillTaskFields(result);
    setAIStatus('✓ fields populated — review & save', 'ok');
    showToast('annotations generated', 'success');

    // Mark dirty so nav auto-saves
    const { state } = await import('./state.js');
    state.dirty = true;

  } catch (err) {
    console.error('Gemini error:', err);
    setAIStatus(err.message, 'error');
    showToast('gemini error — see panel', 'error');
  } finally {
    setLoading(false);
  }
}

// ── Clear handler ─────────────────────────────────────────────────────────────

function handleClear() {
  TASKS.forEach(task => {
    const q = document.getElementById('q-' + task.key);
    const a = document.getElementById('a-' + task.key);
    if (q) q.value = '';
    if (a) a.value = '';
    // Trigger badge update
    q?.dispatchEvent(new Event('input'));
    a?.dispatchEvent(new Event('input'));
  });
  setAIStatus('fields cleared', 'dim');
}

// ── Fill task fields ──────────────────────────────────────────────────────────

function fillTaskFields(result) {
  // Map Gemini keys → task keys (they already match: vqa, report, rationale)
  const keyMap = { vqa: 'vqa', report: 'report', rationale: 'rationale' };

  for (const [geminiKey, taskKey] of Object.entries(keyMap)) {
    const data = result[geminiKey];
    if (!data) continue;

    const qEl = document.getElementById('q-' + taskKey);
    const aEl = document.getElementById('a-' + taskKey);

    if (qEl) {
      qEl.value = data.question || '';
      qEl.dispatchEvent(new Event('input')); // triggers badge + dirty
      animateField(qEl);
    }
    if (aEl) {
      aEl.value = data.answer || '';
      aEl.dispatchEvent(new Event('input'));
      animateField(aEl);
    }
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function setLoading(on) {
  const btn     = document.getElementById('aiGenerateBtn');
  const text    = document.getElementById('aiBtnText');
  const spinner = document.getElementById('aiBtnSpinner');
  if (!btn) return;
  btn.disabled       = on;
  text.textContent   = on ? 'generating...' : 'generate annotations';
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
  // Force reflow
  void el.offsetWidth;
  el.classList.add('ai-filled');
}