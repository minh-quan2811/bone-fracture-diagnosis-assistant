// ── Question prompt templates ─────────────────────────────────────────────────
// Abstract phrasing templates for each VQA type × polarity.
// Based on VQA-RAD / SLAKE clinical dataset conventions.
// Placeholders (e.g. {finding}, {feature}) are intentionally generic —
// the model fills them from the actual observation at generation time.

export const QUESTION_TEMPLATES = {

  presence: {
    positive: [
      'Is there evidence of {finding} in this image?',
      'Does this image demonstrate {finding}?',
      'Can {finding} be identified in this image?',
      'Does this image show any sign of {finding}?',
      'Is {finding} present in this image?',
      'Does this image contain findings consistent with {finding}?',
      'Are there radiological features of {finding} in this image?',
      'Is {finding} visible in this image?',
      'Does this image reveal the presence of {finding}?',
      'Are there imaging findings suggestive of {finding} here?',
      'Does this image show features that indicate {finding}?',
      'Is {finding} apparent in this image?',
      'Can you identify {finding} from this image?',
      'Does this image support the presence of {finding}?',
      'Is there any indication of {finding} visible in this image?',
    ],
    negative: [
      'Is there evidence of {absent_finding} in this image?',
      'Does this image show any sign of {absent_finding}?',
      'Can {absent_finding} be seen in this image?',
      'Does this image demonstrate {absent_finding}?',
      'Is {absent_finding} visible anywhere in this image?',
      'Does this image contain features of {absent_finding}?',
      'Are there any radiological signs of {absent_finding} in this image?',
      'Is {absent_finding} apparent in this image?',
      'Does this image reveal any indication of {absent_finding}?',
      'Can {absent_finding} be identified from this image?',
      'Are there imaging findings consistent with {absent_finding} here?',
      'Does this image support a diagnosis of {absent_finding}?',
      'Is {absent_finding} present in this image?',
      'Does this image show features suggestive of {absent_finding}?',
      'Are there any signs pointing to {absent_finding} in this image?',
    ],
  },

  location: {
    positive: [
      'Where is the {finding} located in this image?',
      'At what level does the {finding} occur in this image?',
      'Which anatomical region is affected in this image?',
      'What is the anatomical location of the {finding} in this image?',
      'In what part of the image is the {finding} situated?',
      'Which structure is involved based on this image?',
      'Where in this image does the {finding} appear?',
      'What region does the {finding} occupy in this image?',
      'Is the {finding} in this image located at the {correct_location}?',
      'Does this image show the {finding} involving the {correct_structure}?',
      'Is the {correct_side} side involved in this image?',
      'What anatomical structure is visible in this image?',
      'Is this image showing involvement of the {correct_location}?',
      'Which area of the image contains the {finding}?',
      'Does the {finding} in this image affect the {correct_structure}?',
    ],
    negative: [
      'Is the {finding} located at the {wrong_location} in this image?',
      'Does this image show the {finding} occurring at the {wrong_location}?',
      'Is the affected area in this image the {wrong_structure}?',
      'Is the {finding} visible on the {wrong_side} side of this image?',
      'Does the {finding} in this image involve the {wrong_location}?',
      'Is the {finding} originating from the {wrong_structure} in this image?',
      'Does this image show involvement of the {wrong_location}?',
      'Is the {finding} confined to the {wrong_structure} in this image?',
      'Does this image place the {finding} at the {wrong_location}?',
      'Is the {wrong_structure} the primary structure affected in this image?',
      'Does the {finding} in this image appear on the {wrong_side} side?',
      'Is the {finding} here located within the {wrong_location}?',
      'Does this image show the {wrong_structure} as the site of {finding}?',
      'Is the {wrong_location} where the {finding} occurs in this image?',
      'Does this image indicate the {finding} is at the {wrong_location}?',
    ],
  },

  classification: {
    positive: [
      'What type of {finding} is demonstrated in this image?',
      'How would you classify the {finding} seen in this image?',
      'What is the pattern of the {finding} visible in this image?',
      'Which category does the {finding} in this image belong to?',
      'What is the morphological classification of the {finding} in this image?',
      'Is this image consistent with a {correct_type} {finding}?',
      'Does this image show a {correct_type} {finding}?',
      'How is the {finding} in this image best described in terms of type?',
      'What subtype of {finding} does this image represent?',
      'Does the {finding} in this image follow a {correct_type} pattern?',
      'Is the {finding} here an example of a {correct_type} variant?',
      'What classification best fits the {finding} seen in this image?',
      'Does this image depict a {correct_type} form of {finding}?',
      'Is the {finding} in this image of the {correct_type} subtype?',
      'What is the classification of the {finding} shown here?',
    ],
    negative: [
      'Is the {finding} in this image classified as {wrong_type}?',
      'Does this image demonstrate a {wrong_type} {finding}?',
      'Is this image consistent with a {wrong_type} pattern of {finding}?',
      'Does the {finding} in this image follow a {wrong_type} morphology?',
      'Is the {finding} here an example of a {wrong_type} subtype?',
      'Does this image show features of a {wrong_type} {finding}?',
      'Can this image be classified as showing a {wrong_type} {finding}?',
      'Is the {finding} in this image of the {wrong_type} variety?',
      'Does this image depict a {wrong_type} form of {finding}?',
      'Is this a {wrong_type} {finding} based on this image?',
      'Does the {finding} here belong to the {wrong_type} category?',
      'Is the {finding} in this image best described as {wrong_type}?',
      'Does this image represent a {wrong_type} subtype of {finding}?',
      'Is the pattern of {finding} in this image consistent with {wrong_type}?',
      'Does the morphology in this image suggest a {wrong_type} {finding}?',
    ],
  },

  characteristic: {
    positive: [
      // CLINICAL KNOWLEDGE
      'What is the typical cause of the finding shown in this image?',
      'What mechanism is commonly associated with the finding in this image?',
      'What complication can arise from the type of finding demonstrated here?',
      'Is this image consistent with a finding caused by {mechanism}?',
      'Does the finding in this image typically result from {mechanism}?',
      'What is the clinical significance of the finding seen in this image?',
      'What condition is this type of finding most commonly associated with?',
      // FRAGMENT FEATURE
      'Is there {feature} visible in this image?',
      'Does this image show {feature} of the finding?',
      'What is the {attribute} of the finding seen in this image?',
      'How would you describe the {attribute} of the finding in this image?',
      'Is the {feature} in this image consistent with {condition}?',
      'Does the finding in this image exhibit {feature}?',
      'Is the {attribute} of the finding in this image {condition}?',
      'What does the {attribute} of the finding in this image indicate?',
    ],
    negative: [
      // FRAGMENT FEATURE ONLY
      'Is the finding in this image showing {opposite_feature}?',
      'Does this image demonstrate {opposite_condition} of the finding?',
      'Is the {attribute} of the finding in this image {opposite_condition}?',
      'Does this image show the finding with {opposite_feature}?',
      'Is there {opposite_feature} present in this image?',
      'Does the finding in this image appear {opposite_condition}?',
      'Is the finding here consistent with {opposite_feature}?',
      'Does this image show {opposite_feature} as a feature of the finding?',
      'Is the finding in this image characterized by {opposite_feature}?',
      'Does the {attribute} here appear to be {opposite_condition}?',
      'Is {opposite_feature} the dominant feature in this image?',
      'Does this image support the presence of {opposite_feature}?',
      'Is the finding in this image exhibiting {opposite_condition}?',
      'Can {opposite_feature} be identified in the finding shown here?',
      'Does this image indicate {opposite_condition} of the finding?',
    ],
  },
};

// ── Negative polarity options (randomly selected) ────────────────────────────

export const NEGATIVE_OPTIONS = {
  presence: [
    'foreign object or prior surgery',
    'healthy bone',
  ],

  location: [
    // BONE SEGMENTS
    'proximal', 'mid-shaft', 'distal', 'epiphysis', 'metaphysis', 'diaphysis',
    'head', 'neck', 'body', 'base', 'articular surface',
    // UPPER LIMB
    'humerus', 'radius', 'ulna', 'clavicle', 'scapula',
    // HAND / WRIST
    'scaphoid', 'lunate', 'triquetrum', 'capitate', 'hamate',
    'trapezium', 'trapezoid', 'pisiform', 'metacarpals', 'phalanges',
    // LOWER LIMB
    'femur', 'tibia', 'fibula', 'patella', 'hip bone',
    // FOOT / ANKLE
    'calcaneus', 'talus', 'navicular', 'cuboid', 'cuneiforms',
    'metatarsals', 'phalanges',
    // THORAX
    'rib', 'sternum',
    // PELVIS
    'ilium', 'ischium', 'pubis', 'sacrum', 'acetabulum',
  ],

  classification: [
    'comminuted fracture',
    'spiral fracture',
    'greenstick fracture',
    'linear fracture',
    'oblique fracture',
    'oblique displaced fracture',
    'segmental fracture',
    'transverse fracture',
    'transverse displaced fracture',
    'healthy bone',
  ],

  characteristic: [
    // DISPLACEMENT pairs
    { property: 'DISPLACEMENT', correct: 'displaced', opposite: 'non-displaced' },
    { property: 'DISPLACEMENT', correct: 'non-displaced', opposite: 'displaced' },
    // ALIGNMENT pairs
    { property: 'ALIGNMENT', correct: 'angulated', opposite: 'anatomically aligned' },
    { property: 'ALIGNMENT', correct: 'anatomically aligned', opposite: 'angulated' },
    // FRAGMENTS pairs
    { property: 'FRAGMENTS', correct: 'comminuted (multiple fragments)', opposite: 'simple (single fracture line)' },
    { property: 'FRAGMENTS', correct: 'simple (single fracture line)', opposite: 'comminuted (multiple fragments)' },
    // CORTEX pairs
    { property: 'CORTEX', correct: 'disrupted cortex', opposite: 'intact cortex' },
    { property: 'CORTEX', correct: 'intact cortex', opposite: 'disrupted cortex' },
    // POSITION pairs
    { property: 'POSITION', correct: 'overriding', opposite: 'end-to-end apposition' },
    { property: 'POSITION', correct: 'end-to-end apposition', opposite: 'overriding' },
    // ROTATION pairs
    { property: 'ROTATION', correct: 'rotationally deformed', opposite: 'no rotational deformity' },
    { property: 'ROTATION', correct: 'no rotational deformity', opposite: 'rotationally deformed' },
    // LENGTH pairs
    { property: 'LENGTH', correct: 'shortened', opposite: 'normal length' },
    { property: 'LENGTH', correct: 'normal length', opposite: 'shortened' },
  ],
};

/**
 * Sample n unique templates randomly from a given type + polarity pool.
 *
 * @param {'presence'|'location'|'classification'|'characteristic'} type
 * @param {'positive'|'negative'} polarity
 * @param {number} [n=4] - How many templates to sample (clamped to pool size)
 * @returns {string[]} Array of sampled template strings
 */
export function sampleTemplates(type, polarity, n = 3) {
  const pool = QUESTION_TEMPLATES[type]?.[polarity];
  if (!pool || pool.length === 0) return [];

  const count = Math.min(n, pool.length);

  // Fisher-Yates partial shuffle to get `count` unique picks
  const copy = [...pool];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/**
 * Sample random negative options for a given type.
 *
 * @param {'presence'|'location'|'classification'|'characteristic'} type
 * @param {number} [n=1] - How many options to sample (clamped to pool size)
 * @returns {string[]|object[]} Array of randomly selected negative options
 */
export function sampleNegativeOption(type, n = 1) {
  const pool = NEGATIVE_OPTIONS[type];
  if (!pool || pool.length === 0) return [];

  const count = Math.min(n, pool.length);

  // Fisher-Yates partial shuffle to get `count` unique picks
  const copy = [...pool];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}