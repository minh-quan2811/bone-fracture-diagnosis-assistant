// ─── FOLDER LOADER ───────────────────────────────────────────────────────────
// Handles folder picking, directory traversal, and CSV file bootstrapping.

import { state } from './state.js';
import { showToast, setStatus, hideLoadModal } from './ui.js';
import { loadCSV } from './csv.js';
import { switchSplit } from './split.js';

// ── Entry point ───────────────────────────────────────────────────────────────

export async function loadDatasetFolder() {
  try {
    const folderHandle = await window.showDirectoryPicker();
    state.datasetFolderHandle   = folderHandle;
    state.splitFolderHandles    = {};
    state.csvFileHandles        = {};
    state.allFilePaths          = {};
    state.fileSplits            = {};

    const files = [];
    await traverseFolder(folderHandle, '', files);

    if (!files.length) {
      showToast('no files found in folder', 'warn');
      return;
    }

    await ensureCSVFilesExist();
    hideLoadModal();
    await handleFolderLoad(files);
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Error loading folder:', err);
      showToast('error loading folder', 'warn');
    }
  }
}

// ── Traverse ──────────────────────────────────────────────────────────────────

async function traverseFolder(folderHandle, path, files, currentSplit = null) {
  try {
    for await (const [name, handle] of folderHandle.entries()) {
      const fullPath = path ? path + '/' + name : name;
      let nextSplit = currentSplit;

      if (handle.kind === 'file') {
        const file = await handle.getFile();
        state.allFilePaths[file.name] = file.name;
        if (nextSplit) state.fileSplits[file.name] = nextSplit;
        files.push(file);
      } else if (handle.kind === 'directory') {
        if (name === 'train' || name === 'valid' || name === 'test') {
          state.splitFolderHandles[name] = handle;
          nextSplit = name;
          console.log('Found split folder:', name);
        }
        await traverseFolder(handle, fullPath, files, nextSplit);
      }
    }
  } catch (err) {
    console.error('Error traversing folder:', err);
  }
}

// ── CSV bootstrap ─────────────────────────────────────────────────────────────

async function ensureCSVFilesExist() {
  const csvHeader = 'image_path,task_type,question,answer\n';
  const splits = ['train', 'valid', 'test'];

  for (const split of splits) {
    if (!state.splitFolderHandles[split]) continue;

    const splitFolder = state.splitFolderHandles[split];
    const fileName    = split + '_annotations.csv';

    try {
      const csvHandle = await splitFolder.getFileHandle(fileName);
      state.csvFileHandles[split] = csvHandle;
      console.log(`Found existing ${fileName}`);
    } catch (err) {
      if (err.name === 'NotFoundError') {
        try {
          const newHandle = await splitFolder.getFileHandle(fileName, { create: true });
          const writable  = await newHandle.createWritable();
          await writable.write(csvHeader);
          await writable.close();
          state.csvFileHandles[split] = newHandle;
          console.log(`Created new ${fileName}`);
        } catch (createErr) {
          console.error(`Failed to create ${fileName}:`, createErr);
        }
      }
    }
  }
}

// ── Post-load processing ──────────────────────────────────────────────────────

export async function handleFolderLoad(files) {
  state.allFiles = Array.from(files);
  console.log('Total files loaded:', state.allFiles.length);
  setStatus('parsing folder structure...', 'dim');

  state.classNames = await extractClasses(state.allFiles);
  state.splitLoaded = {};
  await switchSplit(state.split);

  showToast('dataset loaded & CSVs ready', 'success');
}

// ── Class extraction ──────────────────────────────────────────────────────────

async function extractClasses(files) {
  // Try data.yaml / data.yml
  const yaml = files.find(f => f.name === 'data.yaml' || f.name === 'data.yml');
  if (yaml) {
    const text = await readText(yaml);
    const match = text.match(/names\s*:\s*\[([^\]]+)\]/);
    if (match) return match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));

    // Block-list style
    const lines = text.split('\n');
    const idx   = lines.findIndex(l => l.trim().startsWith('names:'));
    if (idx !== -1) {
      const classes = [];
      for (let i = idx + 1; i < lines.length; i++) {
        const m = lines[i].match(/^\s*[-\s]*(\S.*)/);
        if (m && !m[1].includes(':')) classes.push(m[1].trim().replace(/['"]/g, ''));
        else if (lines[i].trim() && !lines[i].startsWith(' ') && !lines[i].startsWith('\t')) break;
      }
      if (classes.length) return classes;
    }
  }

  // Try classes.txt
  const clsTxt = files.find(f => f.name === 'classes.txt');
  if (clsTxt) {
    const text = await readText(clsTxt);
    return text.split('\n').map(s => s.trim()).filter(Boolean);
  }

  return ['class_0', 'class_1', 'class_2', 'class_3', 'class_4'];
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