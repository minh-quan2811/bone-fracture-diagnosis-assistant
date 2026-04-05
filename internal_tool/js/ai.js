// ─── AI CLIENT ───────────────────────────────────────────────────────────────
// Unified provider layer: supports Gemini and OpenRouter.
// Keys are fetched once from /api/config (served by server.js from .env).

// ── Constants ─────────────────────────────────────────────────────────────────

export const PROVIDERS = {
  gemini: {
    id:    'gemini',
    label: 'Gemini',
    model: 'gemini-3.1-flash-live-preview',
  },
  openrouter: {
    id:    'openrouter',
    label: 'OpenRouter',
    model: 'qwen/qwen3.6-plus:free',
    // model: 'arcee-ai/trinity-large-preview:free',
  },
};

// Active provider — toggled by the UI
let _activeProvider = 'gemini';

export function getActiveProvider() { return _activeProvider; }
export function setActiveProvider(id) { _activeProvider = id; }

// ── Key cache — loaded once from /api/config ──────────────────────────────────

let _config = null;

async function _getConfig() {
  if (_config) return _config;
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Could not load config from server. Is server.js running?');
  _config = await res.json();
  return _config;
}

// ── Shared system prompt ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert radiologist assistant helping annotate medical X-ray images for a Vision-Language Model (VLM) training dataset.

The user will describe what they observe in an X-ray image. Based on their description, you must generate exactly three structured annotation entries in valid JSON format.

Return ONLY a JSON object — no markdown, no explanation, no code fences. The object must have exactly these three keys:

{
  "vqa": {
    "question": "A specific, clinically relevant visual question about the fracture or finding (e.g. what type, location, severity, displacement)",
    "answer": "A concise, accurate clinical answer based on the user's observation"
  },
  "report": {
    "question": "Generate a radiology report for this image.",
    "answer": "A structured radiology report with: FINDINGS section describing the fracture/abnormality in clinical detail, and IMPRESSION section with the diagnosis. Use professional radiological language."
  },
  "rationale": {
    "question": "Why is this finding classified as shown?",
    "answer": "A step-by-step diagnostic rationale explaining the visual features that support the classification, referencing radiological signs and clinical reasoning."
  }
}

Rules:
- Base all answers strictly on the user's observation — do not invent findings they didn't mention
- Use proper medical/radiological terminology
- Keep VQA answers concise (1-2 sentences), reports structured, rationale explanatory (3-5 sentences)
- The VQA question must be specific to what was observed, not generic`;

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates structured annotation Q&A from a user observation string.
 * Dispatches to the active provider.
 *
 * @param {string} observation
 * @returns {Promise<{ vqa, report, rationale }>}
 */
export async function generateAnnotations(observation) {
  const config = await _getConfig();

  if (_activeProvider === 'gemini') {
    return _callGemini(observation, config.GEMINI_API_KEY);
  } else if (_activeProvider === 'openrouter') {
    return _callOpenRouter(observation, config.OPENROUTER_API_KEY);
  }
  throw new Error(`Unknown provider: ${_activeProvider}`);
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function _callGemini(observation, key) {
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  const model  = PROVIDERS.gemini.model;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(`${apiUrl}?key=${key}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
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

  return _parseAndValidate(raw);
}

// ── OpenRouter ────────────────────────────────────────────────────────────────

async function _callOpenRouter(observation, key) {
  if (!key || key === 'YOUR_OPENROUTER_API_KEY_HERE') {
    throw new Error('OPENROUTER_API_KEY is not set in your .env file.');
  }

  const model = PROVIDERS.openrouter.model;

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
      max_tokens:  1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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

  return _parseAndValidate(raw);
}

// ── Shared response parser ────────────────────────────────────────────────────

function _parseAndValidate(raw) {
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Model returned invalid JSON. Try again.');
  }

  for (const key of ['vqa', 'report', 'rationale']) {
    if (!parsed[key]?.question || !parsed[key]?.answer) {
      throw new Error(`Model response missing "${key}" field. Try again.`);
    }
  }

  return parsed;
}