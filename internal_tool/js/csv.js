// ─── CSV ─────────────────────────────────────────────────────────────────────
// CSV columns: image_path, task_type, polarity, question_type, answer_type, question, answer
//
// NOTE: state.csvData[fname] is now an ARRAY of VQA entry objects, not a keyed object.

import { state } from './state.js';
import { showToast } from './ui.js';

// ── Parse ─────────────────────────────────────────────────────────────────────

export function parseCSVLine(line) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result.map(s => s.trim());
}

export function csvEscape(val) {
  if (!val) return '';
  val = String(val).replace(/"/g, '""');
  if (val.includes(',') || val.includes('"') || val.includes('\n')) val = `"${val}"`;
  return val;
}

/**
 * Parse CSV into state.csvDataBySplit[split][fname] = Array<VQAEntry>
 *
 * Supports:
 *   New (7 cols): image_path, task_type, polarity, question_type, answer_type, question, answer
 *   Old (5 cols): image_path, task_type, question_type, question, answer
 */
export async function loadCSV(file, split) {
  const targetSplit = split || state.split;
  const text  = await _readText(file);
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 2) return;

  if (!state.csvDataBySplit[targetSplit]) state.csvDataBySplit[targetSplit] = {};

  const header     = lines[0].toLowerCase();
  const isNewFormat = header.includes('polarity') && header.includes('answer_type');

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 4) continue;

    let imgPath, taskType, polarity, questionType, answerType, question, answer;

    if (isNewFormat && cols.length >= 7) {
      [imgPath, taskType, polarity, questionType, answerType, question, answer] = cols;
    } else if (cols.length >= 5) {
      // Old 5-col format
      [imgPath, taskType, questionType, question, answer] = cols;
      polarity    = 'positive';
      answerType  = 'open';
    } else {
      continue;
    }

    const fname = imgPath.split('/').pop().split('\\').pop();
    if (!state.csvDataBySplit[targetSplit][fname]) {
      state.csvDataBySplit[targetSplit][fname] = [];
    }

    state.csvDataBySplit[targetSplit][fname].push({
      task_type:     taskType     || '',
      polarity:      polarity     || 'positive',
      question_type: questionType || '',
      answer_type:   answerType   || 'open',
      question:      question     || '',
      answer:        answer       || '',
    });
  }
}

// ── Generate ──────────────────────────────────────────────────────────────────

export function generateCSVText() {
  const rows = ['image_path,task_type,polarity,question_type,answer_type,question,answer'];

  for (const [fname, entries] of Object.entries(state.csvData)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!entry.question && !entry.answer) continue;
      const imgPath = `${state.split}/images/${fname}`;
      rows.push([
        csvEscape(imgPath),
        csvEscape(entry.task_type     || 'vqa'),
        csvEscape(entry.polarity      || 'positive'),
        csvEscape(entry.question_type || ''),
        csvEscape(entry.answer_type   || 'open'),
        csvEscape(entry.question),
        csvEscape(entry.answer),
      ].join(','));
    }
  }

  return rows.join('\n');
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveCSVFile() {
  const csvText  = generateCSVText();
  const fileName = state.split + '_annotations.csv';

  if (state.csvFileHandles[state.split]) {
    try {
      const handle   = state.csvFileHandles[state.split];
      const writable = await handle.createWritable();
      await writable.write(csvText);
      await writable.close();
      showToast(`saved to ${state.split}/${fileName}`, 'success');
      return;
    } catch (err) {
      console.error('Error writing CSV:', err);
      showToast('error saving CSV', 'warn');
      return;
    }
  }

  console.warn('No CSV file handle — falling back to download');
  fallbackDownloadCSV();
}

export function fallbackDownloadCSV() {
  const text = generateCSVText();
  const blob = new Blob([text], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = state.split + '_annotations.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function _readText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}