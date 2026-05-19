// ─── AI CLIENT ───────────────────────────────────────────────────────────────
import { sampleTemplates, sampleNegativeOption } from './template.js';

export const PROVIDERS = {
  gemini: {
    id:     'gemini',
    label:  'Gemini',
    models: [
      { id: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
      {id: 'gemini-3.1-flash-lite-preview' , label: 'Gemini 3.1 Flash Lite' },
    ],
  },
  openrouter: {
    id:     'openrouter',
    label:  'OpenRouter',
    models: [
      { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nvidia Nemotron 3 (Free)' },
    ],
  },
};

// ── State ─────────────────────────────────────────────────────────────────────

let _activeProvider  = 'gemini';
let _selectedModels  = {
  gemini:     PROVIDERS.gemini.models[0].id,
  openrouter: PROVIDERS.openrouter.models[0].id,
};
let _customKeys = { gemini: null, openrouter: null };

const STORAGE_KEY_PROVIDER = 'ai_provider';
const STORAGE_KEY_MODELS   = 'ai_models';
const STORAGE_KEY_KEYS     = 'ai_custom_keys';

function _loadFromStorage() {
  try {
    const p = localStorage.getItem(STORAGE_KEY_PROVIDER);
    if (p && PROVIDERS[p]) _activeProvider = p;
    const m = localStorage.getItem(STORAGE_KEY_MODELS);
    if (m) Object.assign(_selectedModels, JSON.parse(m));
    const k = localStorage.getItem(STORAGE_KEY_KEYS);
    if (k) _customKeys = JSON.parse(k);
  } catch {}
}

function _saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_PROVIDER, _activeProvider);
    localStorage.setItem(STORAGE_KEY_MODELS,   JSON.stringify(_selectedModels));
    localStorage.setItem(STORAGE_KEY_KEYS,     JSON.stringify(_customKeys));
  } catch {}
}

_loadFromStorage();

export function getActiveProvider()         { return _activeProvider; }
export function setActiveProvider(id)       { _activeProvider = id; _saveToStorage(); }
export function getSelectedModel(p = null)  { return _selectedModels[p || _activeProvider]; }
export function setSelectedModel(p, id)     { _selectedModels[p] = id; _saveToStorage(); }
export function getCustomKey(p = null)      { return _customKeys[p || _activeProvider]; }
export function setCustomKey(p, key)        { _customKeys[p] = key || null; _saveToStorage(); }

// ── Config cache ──────────────────────────────────────────────────────────────

let _config = null;
async function _getConfig() {
  if (_config) return _config;
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Could not load config. Is server.js running?');
  _config = await res.json();
  return _config;
}

// ── Type definitions (compact) ────────────────────────────────────────────────

export const ALL_TYPES = [
  'modality', 'presence', 'location', 'classification',
  'anatomy', 'knowledge', 'characteristic', 'plane',
];

const TYPE_DEF = {
  modality: {
    def: 'What imaging modality produced this image (X-ray, MRI, CT, ultrasound, etc.). Answer: modality name or yes/no.',
    negStrategy: `Ask whether a WRONG modality was used. Pick from: {options}. Answer must be "no".`,
  },
  presence: {
    def: 'Whether a fracture or abnormality exists. Answer: yes/no only.',
    negStrategy: `Ask about a finding NOT present or NOT healthy bone. Pick from: {options}. Answer must be "no".`,
  },
  location: {
    def: 'WHERE the fracture occurs (bone segment, side, region). Answer: location name or yes/no.',
    negStrategy: `Ask about a WRONG location/structure. Pick from: {options}. Yes/no answer: "no"; open: actual location.`,
  },
  classification: {
    def: 'What fracture TYPE or PATTERN (transverse, oblique, comminuted, etc.). Answer: type name or yes/no.',
    negStrategy: `Ask about an INCORRECT fracture type. Pick from: {options}. Yes/no answer: "no"; open: actual type.`,
  },
  anatomy: {
    def: 'Which bone or body part is shown in the image. Answer: bone/body part name or yes/no.',
    negStrategy: `Ask whether a WRONG bone or body part is shown. Pick from: {options}. Answer must be "no".`,
  },
  knowledge: {
    def: `Clinical knowledge about the structure or injury — choose ONE subcategory:
- FUNCTION/SYSTEM: the bone's function or body system
- CAUSE/MECHANISM: common mechanism or cause of the injury type, how it typically occurs
- TREATMENT: typical management or treatment approach
- COMPLICATION: known complications, risks, or adverse outcomes
- PREVENTION: preventive measures or strategies to avoid injury
- HEALING/PROGNOSIS: expected healing time, recovery period, or outcome
- ASSOCIATED STRUCTURES: structures commonly injured along with this fracture`,
    negStrategy: `Ask about an INCORRECT clinical fact. Pick one: {options}
Format the question so the answer is "no" (yes/no question).`,
  },
  characteristic: {
    def: `A visible structural feature of the fracture — choose ONE:
- DISPLACEMENT: displaced vs non-displaced
- ALIGNMENT: angulated vs anatomically aligned
- FRAGMENTS: comminuted vs simple
- CORTEX: disrupted vs intact
- POSITION: overriding vs end-to-end apposition
- ROTATION: rotationally deformed vs normal
- LENGTH: shortened vs normal`,
    negStrategy: `Ask about the OPPOSITE feature. Pick one pair: {options}
Answer must be "no".`,
  },
  plane: {
    def: 'What radiographic view or projection was used (AP, PA, lateral, oblique, axial, etc.). Answer: view name or yes/no.',
    negStrategy: `Ask whether a WRONG projection was used. Pick from: {options}. Answer must be "no".`,
  },
};

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * Build generation plan:
 * - 2 user-selected types → 1 pair each (with chosen polarity)
 * - randomly pick 4–6 from the remaining 6 types → 1 pair each (polarity: 65% positive, 35% negative)
 * Total: 6–8 pairs
 * @param {Array<{type,polarity}>} primaryConfigs  - 2 user-selected types
 * @returns {Array<{type,polarity,count}>}
 */
function _buildPlan(primaryConfigs) {
  const primaryTypes   = primaryConfigs.map(c => c.type);
  const secondaryTypes = ALL_TYPES.filter(t => !primaryTypes.includes(t));

  // Shuffle secondary types (Fisher-Yates)
  for (let i = secondaryTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [secondaryTypes[i], secondaryTypes[j]] = [secondaryTypes[j], secondaryTypes[i]];
  }

  // Pick 4–6 at random
  const secondaryCount = 4 + Math.floor(Math.random() * 3); // 4, 5, or 6
  const picked = secondaryTypes.slice(0, secondaryCount);

  // Weighted polarity: 70% positive, 30% negative
  const randomPolarity = () => Math.random() < 0.7 ? 'positive' : 'negative';

  const plan = [
    ...primaryConfigs.map(c => ({ ...c, count: 1 })),
    ...picked.map(t => ({ type: t, polarity: randomPolarity(), count: 1 })),
  ];
  return plan;
}

function _buildTypeInstruction(type, polarity, count) {
  const def = TYPE_DEF[type];
  let body = `Definition: ${def.def}\n`;

  if (polarity === 'negative') {
    let strategy = def.negStrategy;
    if (type === 'characteristic') {
      const pairs = sampleNegativeOption('characteristic', 3);
      strategy = strategy.replace('{options}', pairs.map(p => `${p.property}: ${p.correct} ↔ ${p.opposite}`).join('; '));
    } else if (type === 'knowledge') {
      const opts = sampleNegativeOption('knowledge', 4);
      strategy = strategy.replace('{options}', opts.map(o => `${o.category}: "${o.value}"`).join(', '));
    } else {
      const opts = sampleNegativeOption(type, 4);
      strategy = strategy.replace('{options}', opts.join(', '));
    }
    body += `Negative strategy: ${strategy}\n`;
  }

  const samples = sampleTemplates(type, polarity, 3);
  if (samples.length) body += `Example phrasings: ${samples.map(s => `"${s}"`).join(' | ')}\n`;

  return `- type="${type}" polarity="${polarity}" → generate ${count} entr${count > 1 ? 'ies' : 'y'}\n${body}`;
}

function _buildPrompt(plan) {
  const typeInstructions = plan
    .map(p => _buildTypeInstruction(p.type, p.polarity, p.count))
    .join('\n');

  const total = plan.reduce((s, p) => s + p.count, 0);

  return `You are a radiologist assistant creating VQA training data from X-ray/MRI descriptions.

Generate exactly ${total} VQA entries. Return ONLY valid JSON (no markdown):

{
  "vqa": [
    {
      "question": "...",
      "answer": "...",
      "answer_type": "open" | "closed",
      "question_type": "modality|presence|location|classification|anatomy|knowledge|characteristic|plane",
      "polarity": "positive|negative"
    }
  ]
}

FIELD RULES:
- answer_type: "closed" if question expects yes/no, else "open"
- answer: max 5 words; for closed=yes/no only; for open=concise value; multiple findings separated by comma
- question: always reference "the image" or "this image" — never name the body part explicitly
- base all answers strictly on the user's observation

ENTRIES TO GENERATE (in this order):
${typeInstructions}

CONSTRAINTS:
- No duplicate questions across entries
- Vary phrasing and subcategory selection across entries of the same type`;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * @param {string} observation
 * @param {Array<{type,polarity}>} primaryConfigs - exactly 2 user-selected configs
 * @returns {Promise<{vqa: Array}>}
 */
export async function generateAnnotations(observation, primaryConfigs) {
  if (!primaryConfigs || primaryConfigs.length !== 2) {
    throw new Error('Exactly 2 primary VQA type configurations must be provided.');
  }

  const plan   = _buildPlan(primaryConfigs);
  const prompt = _buildPrompt(plan);
  const config = await _getConfig();

  if (_activeProvider === 'gemini') {
    const key = _customKeys.gemini || config.GEMINI_API_KEY;
    return _callGemini(observation, key, prompt, plan);
  } else if (_activeProvider === 'openrouter') {
    const key = _customKeys.openrouter || config.OPENROUTER_API_KEY;
    return _callOpenRouter(observation, key, prompt, plan);
  }
  throw new Error(`Unknown provider: ${_activeProvider}`);
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function _callGemini(observation, key, prompt, plan) {
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env or provide a custom key.');
  }
  const model  = getSelectedModel('gemini');
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(`${apiUrl}?key=${key}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: prompt }] },
      contents: [{ role: 'user', parts: [{ text: `X-ray observation: ${observation.trim()}` }] }],
      generationConfig: {
        temperature:      0.3,
        maxOutputTokens:  1500,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${err?.error?.message || `HTTP ${res.status}`}`);
  }
  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Empty response from Gemini.');
  return _parseAndValidate(raw, plan);
}

// ── OpenRouter ────────────────────────────────────────────────────────────────

async function _callOpenRouter(observation, key, prompt, plan) {
  if (!key || key === 'YOUR_OPENROUTER_API_KEY_HERE') {
    throw new Error('OPENROUTER_API_KEY is not set. Add it to .env or provide a custom key.');
  }
  const model = getSelectedModel('openrouter');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer':  window.location.origin,
      'X-Title':       'VLM Annotator',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens:  1500,
      messages: [
        { role: 'system',  content: prompt },
        { role: 'user',    content: `X-ray observation: ${observation.trim()}` },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${err?.error?.message || `HTTP ${res.status}`}`);
  }
  const data = await res.json();
  const raw  = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from OpenRouter.');
  return _parseAndValidate(raw, plan);
}

// ── Parser + validator ────────────────────────────────────────────────────────

function _parseAndValidate(raw, plan) {
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try { parsed = JSON.parse(clean); }
  catch { throw new Error('Model returned invalid JSON. Try again.'); }

  if (!Array.isArray(parsed.vqa) || parsed.vqa.length === 0) {
    throw new Error('"vqa" must be a non-empty array.');
  }

  // Enforce plan-specified types and polarities in order
  const flatPlan = plan.flatMap(p => Array(p.count).fill({ type: p.type, polarity: p.polarity }));
  parsed.vqa = parsed.vqa.slice(0, flatPlan.length).map((entry, i) => ({
    ...entry,
    question_type: flatPlan[i]?.type     || entry.question_type,
    polarity:      flatPlan[i]?.polarity || entry.polarity || 'positive',
    answer_type:   entry.answer_type || 'open',
  }));

  for (const [i, entry] of parsed.vqa.entries()) {
    if (!entry.question || !entry.answer) {
      throw new Error(`vqa[${i}] is missing question or answer.`);
    }
  }

  return parsed;
}