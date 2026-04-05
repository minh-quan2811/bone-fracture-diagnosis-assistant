// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const TASKS = [
  { key: 'vqa',       label: 'Visual QA',          color: '#00d4aa', defaultQ: 'What type of fracture is present in this image?' },
  { key: 'report',    label: 'Report Generation',   color: '#0099ff', defaultQ: 'Generate a radiology report for this image.' },
  { key: 'rationale', label: 'Rationale Diagnosis', color: '#a855f7', defaultQ: 'Why is this finding classified as shown?' }
];

export const BOX_COLORS = ['#00d4aa','#0099ff','#ff6b35','#a855f7','#f59e0b','#ec4899','#10b981'];

// ─── STATE ───────────────────────────────────────────────────────────────────

export const state = {
  allFiles: [],
  allFilePaths: {},
  fileSplits: {},
  fileTypes: {},
  split: 'train',
  imageFiles: [],
  labelFiles: {},
  classNames: [],
  csvDataBySplit: { train: {}, valid: {}, test: {} },
  get csvData() { return this.csvDataBySplit[this.split]; },
  set csvData(val) { this.csvDataBySplit[this.split] = val; },
  currentIndex: 0,
  dirty: false,
  splitLoaded: {},
  csvFileHandles: {},
  splitFolderHandles: {},
  datasetFolderHandle: null
};