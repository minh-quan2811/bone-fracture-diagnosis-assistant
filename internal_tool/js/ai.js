// ─── AI CLIENT ───────────────────────────────────────────────────────────────
// Unified provider layer: supports Gemini and OpenRouter.
// Keys are fetched once from /api/config (served by server.js from .env).

export const PROVIDERS = {
  gemini: {
    id:    'gemini',
    label: 'Gemini',
    model: 'gemini-2.5-flash-lite',  // gemini-2.5-flash  gemini-2.5-flash-lite
  },
  openrouter: {
    id:    'openrouter',
    label: 'OpenRouter',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
  },
};

let _activeProvider = 'gemini';
export function getActiveProvider()   { return _activeProvider; }
export function setActiveProvider(id) { _activeProvider = id; }

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
    negativeStrategy: `Ask about a finding or abnormality that is NOT present in the user's description. Choose from:
      - bone condition (healthy bone)
      - joint issue
      - soft tissue abnormality
      - foreign object or prior surgery
    Ensure the correct answer is "no" based on what the user described.`,
  },

  location: {
    // SLAKE: Position, Organ
    def: `Asks either:
  - WHERE a finding is spatially located in the image (e.g. "Where is the fracture located?", "At what level does the fracture occur?", "Is the fracture in the upper or lower part of the image?")
  - WHICH bone or anatomical structure is visible (e.g. "Which bone is shown in this image?", "What anatomical structure is visible in this image?")`,
    answer: 'For yes/no questions, answer "no" or "yes". For open questions, answer with the actual location/structure from the description as concisely as possible. No period.',
    negativeStrategy: `Ask about a location or anatomical structure that is DIFFERENT from what the user described. Strategies:
      - different region
      - different part of the bone
      - different side
      - different bone or structure
    For yes/no questions, answer "no". The answer should name the actual location/structure from the description, contradicting the question.`,
  },

  classification: {
    // SLAKE: (no subcategory — single type)
    def: 'Asks what type, pattern, or category a finding belongs to (e.g. "What type of fracture is this?", "How would you classify this fracture?", "Is this a comminuted fracture?").',
    answer: 'For yes/no questions, answer answer "no" or "yes". For open questions, answer with the actual classification from the description as concisely as possible. No period. ',
    negativeStrategy: `Ask about a classification type that is INCORRECT based on the description. Strategies:
      - fracture pattern
      - complexity
      - mechanism
      - stability
    For yes/no questions, answer "no".`,
  },

  characteristic: {
        // SLAKE: KG, Shape, Abnormal (feature-specific)
        def: `Asks about a specific feature of a finding. Choose ONLY ONE of these three subcategories per entry:
      - CLINICAL KNOWLEDGE: general facts about the fracture type (e.g. cause, mechanism, complications)
      - FRAGMENT FEATURE: a particular attribute visible in the image related to fragment position, alignment, rotational orientation, or bone length change.
      
      Do not combine subcategories — each question must belong to exactly one.`,
        answer: 'For yes/no questions, answer "yes" or "no" only. Otherwise answer only what is asked, as concisely as possible. No period.',
        negativeStrategy: `For negative answers, use ONLY FRAGMENT FEATURE subcategories (NEVER CLINICAL KNOWLEDGE).

      FRAGMENT FEATURE negative strategy:
      - Identify one structural feature (alignment, displacement, fragments, cortex).
      - Replace it with its opposite condition:
        - displaced ↔ aligned
        - angulated ↔ normal alignment
        - fragmented ↔ single piece
        - disrupted cortex ↔ intact cortex
      
      Answer "no" for yes/no questions. For open questions, answer with the actual feature from the description.`,
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
    
    let instruction = `${num}. "${config.type}" (${config.polarity} answer):\n`;
    instruction += `   Definition: ${def.def}\n`;
    
    if (config.polarity === 'negative') {
      instruction += `   NEGATIVE STRATEGY: ${def.negativeStrategy}\n`;
      instruction += `   ${def.answer}`;
    } else {
      instruction += `   POSITIVE STRATEGY: Ask about features that ARE present in the description.\n`;
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
- For "characteristic" questions, pick ONE subcategory (CLINICAL KNOWLEDGE, SHAPE/GEOMETRY,
  or FEATURE-SPECIFIC) and stay within it.
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
    return _callGemini(observation, config.GEMINI_API_KEY, prompt, typeConfigs);
  } else if (_activeProvider === 'openrouter') {
    return _callOpenRouter(observation, config.OPENROUTER_API_KEY, prompt, typeConfigs);
  }
  throw new Error(`Unknown provider: ${_activeProvider}`);
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function _callGemini(observation, key, prompt, typeConfigs) {
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  const model  = PROVIDERS.gemini.model;
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
    throw new Error('OPENROUTER_API_KEY is not set in your .env file.');
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer':  window.location.origin,
      'X-Title':       'VLM Annotator',
    },
    body: JSON.stringify({
      model:       PROVIDERS.openrouter.model,
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