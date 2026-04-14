// ─── AI CLIENT ───────────────────────────────────────────────────────────────
// Unified provider layer: supports Gemini and OpenRouter.
// Keys are fetched once from /api/config (served by server.js from .env).
import { sampleTemplates, sampleNegativeOption } from './template.js';

export const PROVIDERS = {
  gemini: {
    id:     'gemini',
    label:  'Gemini',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
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

// ── State management ──────────────────────────────────────────────────────────

let _activeProvider = 'gemini';
let _selectedModels  = {
  gemini:     PROVIDERS.gemini.models[0].id,      // Default to first model
  openrouter: PROVIDERS.openrouter.models[0].id,
};
let _customKeys = {
  gemini:     null,
  openrouter: null,
};

// Load from localStorage
const STORAGE_KEY_PROVIDER = 'ai_provider';
const STORAGE_KEY_MODELS   = 'ai_models';
const STORAGE_KEY_KEYS     = 'ai_custom_keys';

function _loadFromStorage() {
  try {
    const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER);
    if (savedProvider && PROVIDERS[savedProvider]) {
      _activeProvider = savedProvider;
    }

    const savedModels = localStorage.getItem(STORAGE_KEY_MODELS);
    if (savedModels) {
      const parsed = JSON.parse(savedModels);
      Object.keys(parsed).forEach(provider => {
        if (PROVIDERS[provider]) _selectedModels[provider] = parsed[provider];
      });
    }

    const savedKeys = localStorage.getItem(STORAGE_KEY_KEYS);
    if (savedKeys) {
      _customKeys = JSON.parse(savedKeys);
    }
  } catch (err) {
    console.warn('Failed to load AI settings from localStorage:', err);
  }
}

function _saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_PROVIDER, _activeProvider);
    localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(_selectedModels));
    localStorage.setItem(STORAGE_KEY_KEYS, JSON.stringify(_customKeys));
  } catch (err) {
    console.warn('Failed to save AI settings to localStorage:', err);
  }
}

_loadFromStorage();

export function getActiveProvider()   { return _activeProvider; }
export function setActiveProvider(id) { 
  _activeProvider = id; 
  _saveToStorage();
}

export function getSelectedModel(providerId = null) {
  const provider = providerId || _activeProvider;
  return _selectedModels[provider];
}

export function setSelectedModel(providerId, modelId) {
  _selectedModels[providerId] = modelId;
  _saveToStorage();
}

export function getCustomKey(providerId = null) {
  const provider = providerId || _activeProvider;
  return _customKeys[provider];
}

export function setCustomKey(providerId, key) {
  _customKeys[providerId] = key || null;
  _saveToStorage();
}

// ── Key cache ─────────────────────────────────────────────────────────────────

let _config = null;

async function _getConfig() {
  if (_config) return _config;
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Could not load config from server. Is server.js running?');
  _config = await res.json();
  return _config;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

const TYPE_DEFINITIONS = {
  presence: {
    // SLAKE: Abnormal
    def: 'Asks whether a finding or abnormality exists in the image (e.g. "Is there a fracture in this image?", "Is there evidence of a fracture?", "Does this image show any abnormality?").',
    answer: 'Answer "yes" or "no" only — nothing else.',
    negativeStrategy: `Ask about a finding that is NOT present in the observation. 
    Pick ONE from this list that contradicts what the user described:
      {absence_options}
    
    SELECTION RULES:
      - Never pick a type that matches or closely resembles the actual finding.
      - If the observation describes a healthy bone, do NOT pick "healthy bone".
      - Ensure the correct answer is "no" based on what the user described.`,
  },

  location: {
    // SLAKE: Position, Organ
    def: `Asks either:
    - WHERE a finding is spatially located in the image (e.g. "Where is the fracture located?", "At what level does the fracture occur?")
    - WHICH bone or anatomical structure is visible (e.g. "Which bone is shown in this image?", "What anatomical structure is visible in this image?")`,
    answer: 'For yes/no questions, answer "yes". For open questions, answer with the actual location/structure from the description as concisely as possible. No period.',
    negativeStrategy: `Ask about a location or anatomical structure that is DIFFERENT from what the user described.
      Freely pick ANY wrong location from this list:
      {location_options}

      SELECTION RULES:
        - Never pick a location that matches or partially matches the actual finding.
        - For yes/no questions, the answer is "no". For open questions, answer with the actual location from the observation.`,
  },

  classification: {
    // SLAKE: (no subcategory — single type)
    def: 'Asks what type, pattern, or category a finding belongs to (e.g. "What type of fracture is this?", "How would you classify this fracture?", "Is this a comminuted fracture?").',
    answer: 'For yes/no questions, answer "no" or "yes". For open questions, answer with the actual classification from the description as concisely as possible. No period.',
    negativeStrategy: `Ask about a classification type that is INCORRECT based on the description.
    Pick ONE from this list that contradicts what the user described:
      {classification_options}
    
    SELECTION RULES:
      - Never pick a type that matches or closely resembles the actual finding.
      - If the observation describes a transverse fracture, do NOT pick "transverse fracture" or "transverse displaced fracture".
      - If the observation describes a healthy bone, do NOT pick "healthy bone".
      - Ensure the correct answer is "no" based on what the user described.
    For yes/no questions, answer "no".`,
  },

  characteristic: {
    // SLAKE: KG, Shape, Abnormal (feature-specific)
    def: `Asks about a specific feature of a finding. Choose ONLY ONE of these subcategories per entry:
      - CLINICAL KNOWLEDGE: general facts about the fracture type (e.g. cause, mechanism, complications)
      - FRAGMENT FEATURE: a visible attribute in the image related to fragment position, alignment, rotational orientation, or bone length change.
      
      Do not combine subcategories — each question must belong to exactly one.`,
    answer: 'For yes/no questions, answer "yes" or "no" only. Otherwise answer only what is asked, as concisely as possible. No period.',
    negativeStrategy: `Use ONLY FRAGMENT FEATURE subcategory (NEVER CLINICAL KNOWLEDGE).
      Identify one structural feature present in the observation, then ask about its opposite condition.
      {characteristic_options}

      SELECTION RULES:
        - Ask about the OPPOSITE term — that becomes the wrong feature in the question.
        - For yes/no questions, answer "no".`,
  },
};

/**
 * Build the dynamic prompt based on selected types and their polarities.
 * @param {Array} typeConfigs - Array of {type: string, polarity: 'positive'|'negative'}
 */
function _buildPrompt(typeConfigs) {
  const [config1, config2] = typeConfigs;

  // Build instructions for each VQA entry
  const instructions = typeConfigs.map((config, idx) => {
    const def = TYPE_DEFINITIONS[config.type];
    const num = idx + 1;
    
  const samples = sampleTemplates(config.type, config.polarity, 4);
  const templateBlock = samples.length > 0
    ? `   EXAMPLE PHRASINGS (use these as style references, adapt to the actual finding):\n`
      + samples.map(t => `   - "${t}"`).join('\n') + '\n'
    : '';

  let instruction = `${num}. "${config.type}" (${config.polarity} answer):\n`;
  instruction += `   Definition: ${def.def}\n`;

  if (config.polarity === 'negative') {
    let strategyText = def.negativeStrategy;
    
    // Inject randomly sampled options into the strategy
    if (config.type === 'presence' && strategyText.includes('{absence_options}')) {
      const sampledOptions = sampleNegativeOption('presence', 4);
      const optionsList = sampledOptions.map(opt => `      - ${opt}`).join('\n');
      strategyText = strategyText.replace('{absence_options}', optionsList);
    } else if (config.type === 'location' && strategyText.includes('{location_options}')) {
      const sampledLocations = sampleNegativeOption('location', 5);
      const locationList = sampledLocations.join(', ');
      strategyText = strategyText.replace('{location_options}', `\n      ${locationList}\n      `);
    } else if (config.type === 'classification' && strategyText.includes('{classification_options}')) {
      const sampledClassifications = sampleNegativeOption('classification', 5);
      const classificationList = sampledClassifications.map(c => `      - ${c}`).join('\n');
      strategyText = strategyText.replace('{classification_options}', classificationList);
    } else if (config.type === 'characteristic' && strategyText.includes('{characteristic_options}')) {
      const sampledPairs = sampleNegativeOption('characteristic', 4);
      if (sampledPairs && sampledPairs.length > 0) {
        const pairsText = `Pick ONE opposite pair from this list:\n        ${sampledPairs.map(p => `${p.property}: ${p.correct} ↔ ${p.opposite}`).join('\n        ')}`;
        strategyText = strategyText.replace('{characteristic_options}', pairsText);
      }
    }
    
    instruction += `   NEGATIVE STRATEGY: ${strategyText}\n`;
    instruction += templateBlock;
  } else {
    instruction += `   POSITIVE STRATEGY: Ask about features that ARE present in the description.\n`;
    instruction += templateBlock;
    instruction += `   ${def.answer}`;
  }
    
    return instruction;
  }).join('\n\n');

  return `You are a radiologist assistant creating VQA training data from X-ray/MRI descriptions.

Generate 2 VQA entries and 1 report based on the user's X-ray/MRI observation. Return only valid JSON:

{
  "vqa": [
    {
      "question": "...",
      "answer": "...",
      "question_type": "${config1.type}",
      "polarity": "${config1.polarity}"
    },
    {
      "question": "...",
      "answer": "...",
      "question_type": "${config2.type}",
      "polarity": "${config2.polarity}"
    }
  ],
  "report": {
    "question": "Generate a radiology report for this image.",
    "answer": "..."
  }
}

VQA RULES:
${instructions}

QUESTION PHRASING:
- Reference "the image" or "this image" — NEVER name the specific anatomy or body part.
- Vary phrasing and subcategory selection across entries.
- MUST base the answers only on what the user describes.

POLARITY ENFORCEMENT:
- POSITIVE polarity: Ask about features that ARE in the description. Answer should confirm presence/truth.
- NEGATIVE polarity: Follow the NEGATIVE STRATEGY for that type. Answer should deny/contradict the question.

IMPORTANT RULES:
- Never ask the same question twice with different polarities.
- Vary the absent/wrong features across entries when using negative polarity.
- For "characteristic" with negative polarity, NEVER use CLINICAL KNOWLEDGE subcategory.
- Answer with max 2 words, if have multiple findings, separate it by comma

REPORT FORMAT:
Generate a structured radiology report with two sections continuously flowing from one to the next:
- FINDINGS: 2-3 sentences describing the fracture or abnormality in clinical detail using professional radiological language
- IMPRESSION: state the diagnosis concisely`;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * @param {string} observation - What the user observed in the X-ray
 * @param {Array} typeConfigs - Array of {type: string, polarity: 'positive'|'negative'}
 */
export async function generateAnnotations(observation, typeConfigs) {
  if (!typeConfigs || typeConfigs.length !== 2) {
    throw new Error('Exactly 2 VQA type configurations must be provided.');
  }

  const config = await _getConfig();
  const prompt = _buildPrompt(typeConfigs);

  if (_activeProvider === 'gemini') {
    const apiKey = _customKeys.gemini || config.GEMINI_API_KEY;
    return _callGemini(observation, apiKey, prompt, typeConfigs);
  } else if (_activeProvider === 'openrouter') {
    const apiKey = _customKeys.openrouter || config.OPENROUTER_API_KEY;
    return _callOpenRouter(observation, apiKey, prompt, typeConfigs);
  }
  throw new Error(`Unknown provider: ${_activeProvider}`);
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function _callGemini(observation, key, prompt, typeConfigs) {
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not set. Please add it to .env or provide a custom key.');
  }

  const model  = getSelectedModel('gemini');
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(`${apiUrl}?key=${key}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: prompt }] },
      contents: [{
        role:  'user',
        parts: [{ text: `X-ray observation: ${observation.trim()}` }],
      }],
      generationConfig: {
        temperature:      0.3,
        maxOutputTokens:  1024,
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

  return _parseAndValidate(raw, typeConfigs);
}

// ── OpenRouter ────────────────────────────────────────────────────────────────

async function _callOpenRouter(observation, key, prompt, typeConfigs) {
  if (!key || key === 'YOUR_OPENROUTER_API_KEY_HERE') {
    throw new Error('OPENROUTER_API_KEY is not set. Please add it to .env or provide a custom key.');
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
      model:       model,
      temperature: 0.3,
      max_tokens:  1024,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user',   content: `X-ray observation: ${observation.trim()}` },
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

  return _parseAndValidate(raw, typeConfigs);
}

// ── Parser + validator ────────────────────────────────────────────────────────

function _parseAndValidate(raw, typeConfigs) {
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Model returned invalid JSON. Try again.');
  }

  if (!Array.isArray(parsed.vqa) || parsed.vqa.length !== 2) {
    throw new Error('"vqa" must be an array of exactly 2 entries.');
  }

  for (const [i, entry] of parsed.vqa.entries()) {
    if (!entry.question || !entry.answer || !entry.question_type) {
      throw new Error(`vqa[${i}] is missing question, answer, or question_type.`);
    }
    // Ensure the model respected the requested types and polarities
    if (typeConfigs) {
      entry.question_type = typeConfigs[i].type;
      entry.polarity = typeConfigs[i].polarity;
    }
  }

  if (!parsed.report?.question || !parsed.report?.answer) {
    throw new Error('Model response missing "report" field.');
  }

  return parsed;
}
