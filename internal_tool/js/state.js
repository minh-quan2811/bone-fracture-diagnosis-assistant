// ─── CONSTANTS ───────────────────────────────────────────────────────────────

// Kept for reference / any external code that still imports it.
// No longer used for rendering static task cards — VQA pairs are now dynamic.
export const TASKS = [];

export const BOX_COLORS = ['#00d4aa','#0099ff','#ff6b35','#a855f7','#f59e0b','#ec4899','#10b981'];

// ─── STATE ───────────────────────────────────────────────────────────────────
// csvData[fname] is now Array<VQAEntry> where VQAEntry = {
//   task_type, polarity, question_type, answer_type, question, answer
// }

export const state = {
  allFiles:    [],
  allFilePaths: {},
  fileSplits:  {},
  fileTypes:   {},
  split:       'train',
  imageFiles:  [],
  labelFiles:  {},
  classNames:  [],
  csvDataBySplit: { train: {}, valid: {}, test: {} },
  get  csvData()    { return this.csvDataBySplit[this.split]; },
  set  csvData(val) { this.csvDataBySplit[this.split] = val; },
  currentIndex: 0,
  dirty:        false,
  splitLoaded:  {},
  csvFileHandles:     {},
  splitFolderHandles: {},
  datasetFolderHandle: null,
};