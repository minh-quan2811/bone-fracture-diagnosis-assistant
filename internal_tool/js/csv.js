// ─── CSV ─────────────────────────────────────────────────────────────────────
// Handles CSV parsing, generation, saving, and fallback download.

import { state } from './state.js';
import { showToast } from './ui.js';

// ── Parse ─────────────────────────────────────────────────────────────────────

export function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
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
  if (val.includes(',') || val.includes('"') || val.includes('\n')) val = '"' + val + '"';
  return val;
}

/**
 * Parse a CSV file and populate the given split's csvData.
 * @param {File} file - The CSV File object to read.
 * @param {string} [split] - Which split to populate. Defaults to state.split.
 */
export async function loadCSV(file, split) {
  const targetSplit = split || state.split;
  const text = await readText(file);
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 2) return;

  // Ensure the target split bucket exists
  if (!state.csvDataBySplit[targetSplit]) state.csvDataBySplit[targetSplit] = {};

  // header: image_path,task_type,question,answer
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 4) continue;
    const [imgPath, taskType, question, answer] = cols;
    const fname = imgPath.split('/').pop().split('\\').pop();
    if (!state.csvDataBySplit[targetSplit][fname]) state.csvDataBySplit[targetSplit][fname] = {};
    state.csvDataBySplit[targetSplit][fname][taskType] = { q: question, a: answer };
  }
}

// ── Generate ──────────────────────────────────────────────────────────────────

export function generateCSVText() {
  const rows = ['image_path,task_type,question,answer'];
  // Only export the current split's data
  for (const [fname, tasks] of Object.entries(state.csvData)) {
    for (const [taskKey, data] of Object.entries(tasks)) {
      if (!data.q && !data.a) continue;
      const imgPath = state.split + '/images/' + fname;
      rows.push([csvEscape(imgPath), csvEscape(taskKey), csvEscape(data.q), csvEscape(data.a)].join(','));
    }
  }
  return rows.join('\n');
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveCSVFile() {
  try {
    const csvText = generateCSVText();
    const fileName = state.split + '_annotations.csv';

    if (state.csvFileHandles[state.split]) {
      try {
        const handle = state.csvFileHandles[state.split];
        const writable = await handle.createWritable();
        await writable.write(csvText);
        await writable.close();
        showToast(`saved to ${state.split}/${fileName}`, 'success');
        return;
      } catch (err) {
        console.error('Error writing to CSV file:', err);
        showToast('error saving CSV', 'warn');
        return;
      }
    }

    console.warn('No CSV file handle available, falling back to download');
    fallbackDownloadCSV();
  } catch (err) {
    console.error('Error saving CSV:', err);
    fallbackDownloadCSV();
  }
}

export function fallbackDownloadCSV() {
  const text = generateCSVText();
  const blob = new Blob([text], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = state.split + '_annotations.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function readText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}