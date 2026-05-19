// ─── AI PANEL ────────────────────────────────────────────────────────────────
import {
  generateAnnotations,
  setActiveProvider,
  getActiveProvider,
  PROVIDERS,
  getSelectedModel,
  setSelectedModel,
  getCustomKey,
  setCustomKey,
} from './ai.js';
import { TASKS } from './state.js';
import { showToast } from './ui.js';
import { saveCSVFile } from './csv.js';

// ── Init ──────────────────────────────────────────────────────────────────────

export function initAIPanel() {
  _renderProviderTabs();
  _renderModelSelect();
  _initKeyToggle();
  _initTypePills();
  window.aiGenerate       = handleGenerate;
  window.aiClear          = handleClear;
  window.aiClearCustomKey = handleClearCustomKey;
  // Navigation lock flag — checked by navigate() and keyboard handler
  window._aiGenerating    = false;
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
}

function _switchProvider(id) {
  setActiveProvider(id);
  document.querySelectorAll('.ai-provider-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.provider === id);
  });
  _renderModelSelect();
  _updateKeyToggleState();
  setAIStatus('provider: ' + PROVIDERS[id].label, 'dim');
}

// ── Model selector ────────────────────────────────────────────────────────────

function _renderModelSelect() {
  const select = document.getElementById('aiModelSelect');
  if (!select) return;
  const provider = PROVIDERS[getActiveProvider()];
  select.innerHTML = '';
  provider.models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id; opt.textContent = m.label;
    select.appendChild(opt);
  });
  select.value    = getSelectedModel();
  select.onchange = () => {
    setSelectedModel(getActiveProvider(), select.value);
    setAIStatus(`model: ${select.options[select.selectedIndex].text}`, 'dim');
  };
}

// ── API key toggle ────────────────────────────────────────────────────────────

function _initKeyToggle() {
  const toggle   = document.getElementById('aiKeyToggle');
  const keyRow   = document.getElementById('aiKeyRow');
  const keyInput = document.getElementById('aiCustomKey');
  if (!toggle || !keyRow || !keyInput) return;

  const saved = getCustomKey();
  if (saved) { keyInput.value = saved; keyRow.classList.remove('hidden'); toggle.classList.add('active'); }

  toggle.onclick = () => {
    keyRow.classList.toggle('hidden');
    toggle.classList.toggle('active');
    if (!keyRow.classList.contains('hidden')) keyInput.focus();
  };
  keyInput.oninput = () => {
    setCustomKey(getActiveProvider(), keyInput.value.trim());
    _updateKeyToggleState();
  };
  _updateKeyToggleState();
}

function _updateKeyToggleState() {
  const toggle   = document.getElementById('aiKeyToggle');
  const keyInput = document.getElementById('aiCustomKey');
  if (!toggle || !keyInput) return;
  const saved = getCustomKey();
  keyInput.value = saved || '';
  toggle.classList.toggle('active', !!(saved && saved.length));
  if (saved) setAIStatus('using custom API key', 'dim');
}

function handleClearCustomKey() {
  const keyInput = document.getElementById('aiCustomKey');
  const keyRow   = document.getElementById('aiKeyRow');
  const toggle   = document.getElementById('aiKeyToggle');
  if (!keyInput) return;
  keyInput.value = '';
  setCustomKey(getActiveProvider(), null);
  keyRow?.classList.add('hidden');
  toggle?.classList.remove('active');
  setAIStatus('using .env API key', 'dim');
  showToast('custom key cleared', 'success');
}

// ── Type pill selector ────────────────────────────────────────────────────────

const MAX_SELECTED = 2;

function _initTypePills() {
  const pills = document.querySelectorAll('#aiTypePills .type-pill input');
  pills.forEach(cb => {
    cb.addEventListener('change', () => { _enforceLimit(pills); _updateHint(pills); });
  });
  document.querySelectorAll('.polarity-toggle').forEach(toggle => {
    toggle.addEventListener('click', e => {
      const pill = e.target.closest('.type-pill');
      const cb   = pill.querySelector('input[type="checkbox"]');
      if (cb.checked) {
        const next = (toggle.dataset.polarity || 'positive') === 'positive' ? 'negative' : 'positive';
        toggle.dataset.polarity = next;
        toggle.textContent      = next === 'positive' ? '+' : '−';
        toggle.title            = `Answer polarity: ${next}`;
      }
    });
  });
  _updateHint(pills);
}

function _enforceLimit(pills) {
  const checked = [...pills].filter(cb => cb.checked);
  if (checked.length > MAX_SELECTED) {
    for (const cb of pills) {
      if (cb.checked && !cb._wasChecked) { cb.checked = false; break; }
    }
  }
  pills.forEach(cb => { cb._wasChecked = cb.checked; });
  const nowChecked = [...pills].filter(cb => cb.checked);
  pills.forEach(cb => {
    const pill   = cb.closest('.type-pill');
    const toggle = pill.querySelector('.polarity-toggle');
    pill.classList.toggle('disabled', nowChecked.length >= MAX_SELECTED && !cb.checked);
    if (toggle) {
      toggle.style.display = cb.checked ? 'inline-flex' : 'none';
      if (!cb.checked) { toggle.dataset.polarity = 'positive'; toggle.textContent = '+'; }
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

function _getSelectedTypeConfigs() {
  const configs = [];
  document.querySelectorAll('#aiTypePills .type-pill').forEach(pill => {
    const cb = pill.querySelector('input[type="checkbox"]');
    if (cb.checked) {
      const toggle = pill.querySelector('.polarity-toggle');
      configs.push({ type: cb.value, polarity: toggle?.dataset.polarity || 'positive' });
    }
  });
  return configs.length === MAX_SELECTED ? configs : null;
}

// ── Navigation lock helpers ───────────────────────────────────────────────────

function _lockNavigation() {
  window._aiGenerating = true;
  const prev = document.getElementById('btnPrev');
  const next = document.getElementById('btnNext');
  if (prev) prev.disabled = true;
  if (next) next.disabled = true;
}

function _unlockNavigation() {
  window._aiGenerating = false;
  const { state } = { state: null };
  _restoreNavButtons();
}

async function _restoreNavButtons() {
  const { state } = await import('./state.js');
  const prev = document.getElementById('btnPrev');
  const next = document.getElementById('btnNext');
  if (prev) prev.disabled = state.currentIndex === 0;
  if (next) next.disabled = state.currentIndex === state.imageFiles.length - 1;
}

// ── Generate handler ──────────────────────────────────────────────────────────

async function handleGenerate() {
  const obs = document.getElementById('aiObservation')?.value?.trim();
  if (!obs) { setAIStatus('enter an observation first', 'warn'); return; }

  const typeConfigs = _getSelectedTypeConfigs();
  if (!typeConfigs) { setAIStatus('select exactly 2 vqa types first', 'warn'); return; }

  // Snapshot the current index synchronously, before any await.
  // This is the image this generation belongs to — do not allow it to change.
  const { state } = await import('./state.js');
  const generationIndex = state.currentIndex;
  const generationFname = state.imageFiles[generationIndex]?.name;
  if (!generationFname) return;

  // Lock navigation for the entire async operation
  _lockNavigation();
  setLoading(true);

  const modelLabel  = (() => {
    const sel = document.getElementById('aiModelSelect');
    return sel ? sel.options[sel.selectedIndex].text : PROVIDERS[getActiveProvider()].label;
  })();
  const polarityDesc = typeConfigs.map(c => `${c.type}(${c.polarity[0]})`).join(', ');
  setAIStatus(`calling ${modelLabel}... [${polarityDesc}]`, 'dim');

  try {
    const result = await generateAnnotations(obs, typeConfigs);

    // Double-check we're still on the same image (belt-and-suspenders)
    if (state.currentIndex !== generationIndex) {
      console.warn('Image changed during generation — discarding result to prevent corruption.');
      setAIStatus('⚠ image changed during generation — result discarded', 'warn');
      showToast('generation discarded (image changed)', 'warn');
      return;
    }

    await _renderVQAResults(result.vqa, generationIndex, generationFname);
    setAIStatus(`✓ ${result.vqa.length} pairs generated — review & save`, 'ok');
    showToast(`${result.vqa.length} VQA pairs generated`, 'success');

    state.dirty = true;
  } catch (err) {
    console.error('AI error:', err);
    setAIStatus(err.message, 'error');
    showToast('AI error — see panel', 'error');
  } finally {
    setLoading(false);
    _lockNavigation(); // keep locked until unlock call below
    window._aiGenerating = false;
    await _restoreNavButtons();
  }
}

// ── Clear handler ─────────────────────────────────────────────────────────────

async function handleClear() {
  const container = document.getElementById('tasksScroll');
  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="padding:32px;text-align:center;opacity:.5;font-size:13px">
        use ai assist panel to generate vqa pairs<br>or they will appear after generation
      </div>`;
  }
  
  // Clear generated data
  window._generatedVQA = null;
  
  // Clear from CSV state AND save to file
  const { state } = await import('./state.js');
  const { saveCSVFile } = await import('./csv.js');
  const { updateThumbCount } = await import('./annotations.js');
  
  if (state.imageFiles.length > 0) {
    const fname = state.imageFiles[state.currentIndex].name;
    const currentIndex = state.currentIndex;
    
    delete state.csvData[fname];
    state.dirty = true;
    await saveCSVFile();
    
    updateThumbCount(currentIndex, fname);
  }
  
  setAIStatus('cleared and saved', 'dim');
}

// ── Render VQA result cards ───────────────────────────────────────────────────

async function _renderVQAResults(vqaList, generationIndex, generationFname) {
  // Define the desired order of question types
  const TYPE_ORDER = ['modality', 'presence', 'location', 'classification', 'anatomy', 'knowledge', 'characteristic', 'plane'];
  
  // Sort vqaList based on the desired order
  const sortedVQA = [...vqaList].sort((a, b) => {
    const indexA = TYPE_ORDER.indexOf(a.question_type);
    const indexB = TYPE_ORDER.indexOf(b.question_type);
    return indexA - indexB;
  });

  // Store on window for save access — only valid for this specific image
  window._generatedVQA = sortedVQA;

  const scroll = document.getElementById('tasksScroll');
  scroll.innerHTML = '';

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

  sortedVQA.forEach((entry, i) => {
    const color = TYPE_COLORS[entry.question_type] || '#0099ff';
    const card  = document.createElement('div');
    card.className = 'task-card';
    card.style.setProperty('--task-color', color);

    const polarityLabel = entry.polarity === 'negative'
      ? '<span style="color:var(--warn);font-size:10px;margin-left:4px">−neg</span>'
      : '<span style="color:var(--accent);font-size:10px;margin-left:4px">+pos</span>';
    const answerTypeLabel = `<span style="font-size:10px;opacity:.6;margin-left:4px">[${entry.answer_type || 'open'}]</span>`;

    card.innerHTML = `
      <div class="task-header" data-index="${i}" style="cursor:pointer">
        <div class="task-dot"></div>
        <div class="task-name">${entry.question_type}${polarityLabel}${answerTypeLabel}</div>
        <div class="task-badge filled">filled</div>
        <div class="task-toggle">▸</div>
      </div>
      <div class="task-body" id="vqa-body-${i}">
        <div class="field-label">question</div>
        <textarea class="field-input q-input" id="vqa-q-${i}">${entry.question}</textarea>
        <div class="field-label">answer</div>
        <textarea class="field-input a-input" id="vqa-a-${i}">${entry.answer}</textarea>
      </div>
    `;

    // Collapse toggle
    card.querySelector('.task-header').addEventListener('click', () => {
      const body   = card.querySelector('.task-body');
      const toggle = card.querySelector('.task-toggle');
      body.classList.toggle('expanded');
      toggle.textContent = body.classList.contains('expanded') ? '▾' : '▸';
    });

    // Track edits back to window._generatedVQA
    card.querySelector(`#vqa-q-${i}`).addEventListener('input', e => {
      window._generatedVQA[i].question = e.target.value;
    });
    card.querySelector(`#vqa-a-${i}`).addEventListener('input', e => {
      window._generatedVQA[i].answer = e.target.value;
    });

    scroll.appendChild(card);
  });

  const { state } = await import('./state.js');
  const { updateThumbCount } = await import('./annotations.js');
  const { saveCSVFile } = await import('./csv.js');
  
  // Use the pinned fname — never read state.currentIndex here
  state.csvData[generationFname] = sortedVQA;
  state.dirty = false;
  await saveCSVFile();
  updateThumbCount(generationIndex, generationFname);
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

export function setAIStatus(msg, level = 'dim') {
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