// ─── UI UTILITIES ────────────────────────────────────────────────────────────
// Status bar, toast notifications, modal, and counter helpers.

// ── Modal ────────────────────────────────────────────────────────────────────

export function showLoadModal() {
  document.getElementById('loadModal').classList.remove('hidden');
}

export function hideLoadModal() {
  document.getElementById('loadModal').classList.add('hidden');
}

// ── Status bar ───────────────────────────────────────────────────────────────

export function setStatus(msg, level = 'dim') {
  document.getElementById('statusMsg').textContent = msg;
  const dot = document.getElementById('statusDot');
  dot.style.background =
    level === 'ok'   ? 'var(--accent)'     :
    level === 'warn' ? 'var(--warn)'       :
                       'var(--text-muted)';
}

// ── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer;

export function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 2500);
}

// ── Counters ──────────────────────────────────────────────────────────────────

export function updateCounters(imageFiles, currentIndex) {
  document.getElementById('counterCur').textContent   = imageFiles.length ? currentIndex + 1 : '—';
  document.getElementById('counterTotal').textContent = imageFiles.length || '—';
}