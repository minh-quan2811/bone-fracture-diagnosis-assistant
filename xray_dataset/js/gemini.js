// ─── GEMINI ──────────────────────────────────────────────────────────────────
// Calls Gemini API with a user observation and returns structured Q&A
// for the three annotation tasks: vqa, report, rationale.

import { GEMINI_API_KEY } from './config.js';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── System instruction ────────────────────────────────────────────────────────

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
 * @param {string} observation - What the user observed in the X-ray image.
 * @returns {Promise<{ vqa, report, rationale }>} Structured task data.
 */
export async function generateAnnotations(observation) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Gemini API key not set. Edit js/config.js and add your key.');
  }

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [{
      role: 'user',
      parts: [{ text: `X-ray observation: ${observation.trim()}` }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  };

  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Gemini API error: ${msg}`);
  }

  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) throw new Error('Empty response from Gemini');

  // Strip accidental markdown fences just in case
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Gemini returned invalid JSON. Try again.');
  }

  // Validate shape
  for (const key of ['vqa', 'report', 'rationale']) {
    if (!parsed[key]?.question || !parsed[key]?.answer) {
      throw new Error(`Gemini response missing "${key}" field. Try again.`);
    }
  }

  return parsed;
}