// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const TASKS = [
  {
    key:      'vqa_1',
    label:    'Visual QA 1',
    color:    '#00d4aa',
    defaultQ: 'Is there a fracture present in this image?',
    hasType:  true,
  },
  {
    key:      'vqa_2',
    label:    'Visual QA 2',
    color:    '#00b4d8',
    defaultQ: 'Where is the fracture located?',
    hasType:  true,
  },
  {
    key:      'report',
    label:    'Report Generation',
    color:    '#0099ff',
    defaultQ: 'Generate a radiology report for this image.',
    hasType:  false,
  },
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
  datasetFolderHandle: null,
};