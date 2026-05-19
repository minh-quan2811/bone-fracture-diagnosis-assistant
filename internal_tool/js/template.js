// ─── QUESTION TEMPLATES ───────────────────────────────────────────────────────
// 8 question types × positive/negative polarity.
// Placeholders are illustrative — the model fills them from the observation.

export const QUESTION_TEMPLATES = {

  modality: {
    positive: [
      'What imaging modality was used to produce this image?',
      'Which type of medical imaging is shown in this image?',
      'Is this image produced by {correct_modality}?',
      'Does this image represent a {correct_modality} scan?',
      'What type of scan does this image show?',
      'Is this a {correct_modality} image?',
      'Which imaging technique was used for this image?',
      'Does this image correspond to a {correct_modality} study?',
      'What modality was used to acquire this image?',
      'Can you identify the imaging modality in this image?',
      'What kind of medical scan is this image from?',
      'Which diagnostic imaging method produced this image?',
      'Is this image from a {correct_modality} examination?',
      'What imaging technology was used here?',
      'Does this image show a {correct_modality} acquisition?',
    ],
    negative: [
      'Is this image produced by {wrong_modality}?',
      'Does this image represent a {wrong_modality} scan?',
      'Was {wrong_modality} used to acquire this image?',
      'Is this a {wrong_modality} image?',
      'Does this image correspond to a {wrong_modality} study?',
      'Was this image obtained using {wrong_modality}?',
      'Is {wrong_modality} the modality used in this image?',
      'Does this image come from a {wrong_modality} examination?',
      'Was this image captured with {wrong_modality}?',
      'Is this image from a {wrong_modality} acquisition?',
      'Did {wrong_modality} produce this image?',
      'Is the imaging modality here {wrong_modality}?',
      'Was this scan performed using {wrong_modality}?',
      'Does this show a {wrong_modality} study?',
      'Is this diagnostic image from {wrong_modality}?',
    ],
  },

  presence: {
    positive: [
      'Is there evidence of {finding} in this image?',
      'Does this image demonstrate {finding}?',
      'Can {finding} be identified in this image?',
      'Does this image show any sign of {finding}?',
      'Is {finding} present in this image?',
      'Are there radiological features of {finding} in this image?',
      'Is {finding} visible in this image?',
      'Does this image reveal the presence of {finding}?',
      'Are there imaging findings suggestive of {finding} here?',
      'Is there any indication of {finding} visible in this image?',
      'Can you see {finding} in this image?',
      'Does this image contain {finding}?',
      'Are there signs of {finding} shown in this image?',
      'Is {finding} apparent in this image?',
      'Does this image display {finding}?',
    ],
    negative: [
      'Is there evidence of {absent_finding} in this image?',
      'Does this image show any sign of {absent_finding}?',
      'Can {absent_finding} be seen in this image?',
      'Is {absent_finding} visible anywhere in this image?',
      'Are there any radiological signs of {absent_finding} in this image?',
      'Does this image support a diagnosis of {absent_finding}?',
      'Is {absent_finding} present in this image?',
      'Are there any signs pointing to {absent_finding} in this image?',
      'Can {absent_finding} be identified in this image?',
      'Does this image reveal {absent_finding}?',
      'Is there any indication of {absent_finding} here?',
      'Does this image demonstrate {absent_finding}?',
      'Are there features of {absent_finding} in this image?',
      'Is {absent_finding} apparent in this image?',
      'Does this image contain {absent_finding}?',
    ],
  },

  location: {
    positive: [
      'Where is the {finding} located in this image?',
      'At what level does the {finding} occur in this image?',
      'Which anatomical region is affected in this image?',
      'What is the anatomical location of the {finding} in this image?',
      'In what part of the image is the {finding} situated?',
      'Is the {finding} in this image located at the {correct_location}?',
      'Does the {finding} in this image affect the {correct_structure}?',
      'Is the {correct_side} side involved in this image?',
      'Which area of the image contains the {finding}?',
      'What site does the {finding} occupy in this image?',
      'In which region can the {finding} be found in this image?',
      'Where exactly is the {finding} seen in this image?',
      'Which part shows the {finding} in this image?',
      'What is the location of the {finding} shown here?',
      'In what position is the {finding} located in this image?',
    ],
    negative: [
      'Is the {finding} located at the {wrong_location} in this image?',
      'Does this image show the {finding} occurring at the {wrong_location}?',
      'Is the affected area in this image the {wrong_structure}?',
      'Is the {finding} visible on the {wrong_side} side of this image?',
      'Does the {finding} in this image involve the {wrong_location}?',
      'Is the {wrong_structure} the primary structure affected in this image?',
      'Is the {finding} confined to the {wrong_structure} in this image?',
      'Does the {finding} appear at the {wrong_location} in this image?',
      'Is the {wrong_side} side the affected side in this image?',
      'Can the {finding} be seen at the {wrong_location} here?',
      'Is the {finding} situated at the {wrong_location}?',
      'Does the {wrong_structure} contain the {finding} in this image?',
      'Is the location of the {finding} the {wrong_location}?',
      'Does the {finding} occupy the {wrong_structure}?',
      'Is this {finding} at the {wrong_location} level?',
    ],
  },

  classification: {
    positive: [
      'What type of {finding} is demonstrated in this image?',
      'How would you classify the {finding} seen in this image?',
      'What is the pattern of the {finding} visible in this image?',
      'Is this image consistent with a {correct_type} {finding}?',
      'Does this image show a {correct_type} {finding}?',
      'What subtype of {finding} does this image represent?',
      'What classification best fits the {finding} seen in this image?',
      'Is the {finding} in this image of the {correct_type} subtype?',
      'What category does the {finding} in this image fall into?',
      'Can the {finding} in this image be classified as {correct_type}?',
      'What kind of {finding} pattern is visible in this image?',
      'Is this a {correct_type} type of {finding}?',
      'What is the nature of the {finding} shown in this image?',
      'How is the {finding} in this image best described?',
      'What pattern does the {finding} in this image display?',
    ],
    negative: [
      'Is the {finding} in this image classified as {wrong_type}?',
      'Does this image demonstrate a {wrong_type} {finding}?',
      'Is this image consistent with a {wrong_type} pattern of {finding}?',
      'Does the {finding} in this image follow a {wrong_type} morphology?',
      'Is this a {wrong_type} {finding} based on this image?',
      'Is the {finding} in this image best described as {wrong_type}?',
      'Does the morphology in this image suggest a {wrong_type} {finding}?',
      'Can this {finding} be classified as {wrong_type}?',
      'Is the pattern in this image consistent with {wrong_type}?',
      'Does this image show a {wrong_type} configuration?',
      'Is this {finding} of the {wrong_type} category?',
      'Does the {finding} here represent a {wrong_type} subtype?',
      'Is the {finding} pattern {wrong_type} in this image?',
      'Can this be categorized as a {wrong_type} {finding}?',
      'Is this a {wrong_type} variety of {finding}?',
    ],
  },

  anatomy: {
    positive: [
      'Which bone is shown in this image?',
      'What anatomical structure is visible in this image?',
      'Which body part does this image depict?',
      'What bone does this image primarily show?',
      'Is the {correct_bone} visible in this image?',
      'Does this image show the {correct_bone}?',
      'Which skeletal structure is being imaged here?',
      'What part of the skeleton is shown in this image?',
      'What structure is displayed in this image?',
      'Which bone can be identified in this image?',
      'What anatomical region is captured in this image?',
      'Is this image of the {correct_bone}?',
      'What bone is being visualized in this image?',
      'Which structure does this image represent?',
      'What part of the body is imaged here?',
    ],
    negative: [
      'Is this image showing the {wrong_bone}?',
      'Does this image depict the {wrong_bone}?',
      'Is the {wrong_bone} the primary structure visible in this image?',
      'Does this image show the {wrong_body_part}?',
      'Is the {wrong_bone} the bone being imaged here?',
      'Does this image primarily show the {wrong_body_part}?',
      'Is this an image of the {wrong_bone}?',
      'Can the {wrong_bone} be seen in this image?',
      'Is the {wrong_body_part} visible in this image?',
      'Does this image represent the {wrong_bone}?',
      'Is the {wrong_bone} shown in this image?',
      'Does this image visualize the {wrong_bone}?',
      'Is the structure here the {wrong_bone}?',
      'Is this image capturing the {wrong_body_part}?',
      'Does this depict the {wrong_bone}?',
    ],
  },

  knowledge: {
    positive: [
      // Function/System questions
      'What is the primary function of the bone visible in this image?',
      'Which body system does the structure shown in this image belong to?',
      'What role does the bone in this image play in the body?',
      'What system is the structure in this image part of?',
      'What is the main purpose of the bone shown in this image?',
      'Which anatomical system is this structure part of?',
      'What function does this bone serve?',
      'What does the structure in this image do?',
      
      // Cause/Mechanism questions
      'What is a common cause of the type of injury seen in this image?',
      'What mechanism commonly leads to the finding demonstrated here?',
      'What can cause the injury shown in this image?',
      'How does this type of injury typically occur?',
      'What is the usual mechanism of injury for this finding?',
      'What commonly causes this type of fracture?',
      'What event typically results in this injury?',
      'What force or motion usually causes this fracture pattern?',
      'What activity most often leads to this injury?',
      'What is the typical cause of this fracture?',
      
      // Treatment questions
      'What is a typical treatment for the condition demonstrated in this image?',
      'What clinical management is indicated for the condition in this image?',
      'How is the condition in this image usually treated?',
      'What is the standard treatment approach for this injury?',
      'How is this type of fracture typically managed?',
      'What treatment option is commonly used for this finding?',
      'What is the recommended treatment for this condition?',
      'How would this injury typically be managed clinically?',
      'What therapeutic approach is used for this fracture?',
      'What is the usual management for this type of injury?',
      
      // Complication questions
      'What complication can arise from the finding shown in this image?',
      'What is a potential complication of this injury?',
      'What adverse outcome can result from this fracture?',
      'What complication should be monitored for with this injury?',
      'What risk is associated with this type of fracture?',
      'What complication commonly occurs with this injury?',
      'What secondary problem can develop from this fracture?',
      'What is a known risk of this injury?',
      
      // Prevention questions
      'What preventive measure is associated with the condition shown in this image?',
      'How can this type of injury be prevented?',
      'What measure helps prevent this injury?',
      'What is a prevention strategy for this type of fracture?',
      'How is this injury typically avoided?',
      'What can reduce the risk of this injury?',
      
      // Healing/Prognosis questions
      'What is the expected healing time for this injury?',
      'What is the typical recovery period for this fracture?',
      'How long does this type of injury usually take to heal?',
      'What is the prognosis for this fracture?',
      'What is the expected outcome for this injury?',
      
      // Associated structures questions
      'What structures are commonly injured along with this fracture?',
      'What nearby structures may be affected by this injury?',
      'What associated injuries should be evaluated?',
      'What other damage might occur with this fracture?',
    ],
    negative: [
      'Is {wrong_cause} a common cause of the finding shown in this image?',
      'Is {wrong_treatment} the typical treatment for the condition in this image?',
      'Does the structure in this image belong to the {wrong_system}?',
      'Is {wrong_complication} a known complication of the finding shown here?',
      'Is {wrong_prevention} a recommended prevention for the condition in this image?',
      'Is the primary function of the structure in this image {wrong_function}?',
      'Would {wrong_treatment} be used to treat this condition?',
      'Is {wrong_cause} the main mechanism behind this injury?',
      'Does {wrong_complication} commonly result from this finding?',
      'Is the structure here part of the {wrong_system}?',
      'Is {wrong_treatment} the standard approach for this injury?',
      'Does this injury typically result from {wrong_cause}?',
      'Is {wrong_complication} a frequent outcome of this fracture?',
      'Would {wrong_prevention} prevent this type of injury?',
      'Is the healing time for this injury {wrong_duration}?',
    ],
  },

  characteristic: {
    positive: [
      'Is there {feature} visible in this image?',
      'Does this image show {feature} of the finding?',
      'What is the {attribute} of the finding seen in this image?',
      'How would you describe the {attribute} of the finding in this image?',
      'Does the finding in this image exhibit {feature}?',
      'Is the {attribute} of the finding in this image {condition}?',
      'What does the {attribute} of the finding in this image indicate?',
      'What are the key characteristics of the fracture in this image?',
      'How would you describe the displacement of the fracture in this image?',
      'Can {feature} be observed in this image?',
      'Is {feature} present in the finding shown here?',
      'What {attribute} does the finding display in this image?',
      'Does the fracture show {feature}?',
      'What is the degree of {attribute} in this image?',
      'Is the {attribute} {condition} in this finding?',
    ],
    negative: [
      'Is the finding in this image showing {opposite_feature}?',
      'Does this image demonstrate {opposite_condition} of the finding?',
      'Is the {attribute} of the finding in this image {opposite_condition}?',
      'Does this image show the finding with {opposite_feature}?',
      'Is there {opposite_feature} present in this image?',
      'Does the finding in this image appear {opposite_condition}?',
      'Is the finding here consistent with {opposite_feature}?',
      'Does this image support the presence of {opposite_feature}?',
      'Can {opposite_feature} be seen in this image?',
      'Is {opposite_condition} the characteristic shown here?',
      'Does the finding exhibit {opposite_feature} in this image?',
      'Is the {attribute} showing {opposite_condition}?',
      'Does the fracture have {opposite_feature}?',
      'Is this finding {opposite_condition}?',
      'Does this demonstrate {opposite_feature}?',
    ],
  },

  plane: {
    positive: [
      'What radiographic view is shown in this image?',
      'Which projection was used to obtain this image?',
      'Is this image taken in the {correct_view} projection?',
      'Does this image represent a {correct_view} view?',
      'What imaging plane does this image correspond to?',
      'Is this a {correct_view} radiograph?',
      'Which radiographic projection does this image show?',
      'What view was used to acquire this image?',
      'In what plane was this image taken?',
      'Does this image show a {correct_view} view?',
      'Which view does this radiograph represent?',
      'What is the projection of this image?',
      'In which view was this radiograph obtained?',
      'Is this image in the {correct_view} plane?',
      'What radiographic orientation is shown here?',
    ],
    negative: [
      'Is this image taken in the {wrong_view} projection?',
      'Does this image represent a {wrong_view} view?',
      'Was this image acquired in the {wrong_view} plane?',
      'Is this a {wrong_view} radiograph?',
      'Does this image correspond to a {wrong_view} projection?',
      'Was the {wrong_view} view used to obtain this image?',
      'Is this image showing a {wrong_view} projection?',
      'Does this radiograph represent a {wrong_view} view?',
      'Was this taken in the {wrong_view} plane?',
      'Is the projection here {wrong_view}?',
      'Does this show a {wrong_view} orientation?',
      'Was this obtained in the {wrong_view} view?',
      'Is this image in the {wrong_view} plane?',
      'Does this correspond to a {wrong_view} radiograph?',
      'Is the radiographic view {wrong_view}?',
    ],
  },

};

// ── Negative options ──────────────────────────────────────────────────────────

export const NEGATIVE_OPTIONS = {

  modality: [
    'MRI', 'CT scan', 'X-ray', 'ultrasound',
  ],

  presence: [
    'foreign object',
    'prior surgery hardware',
    'healthy bone',
  ],

  location: [
    'proximal', 'mid-shaft', 'distal', 'epiphysis', 'metaphysis', 'diaphysis',
    'head', 'neck', 'body', 'base', 'articular surface',
    'humerus', 'radius', 'ulna', 'clavicle', 'scapula',
    'scaphoid', 'lunate', 'metacarpals', 'phalanges',
    'femur', 'tibia', 'fibula', 'patella',
    'calcaneus', 'talus', 'metatarsals',
    'rib', 'sternum', 'ilium', 'ischium', 'pubis', 'sacrum',
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
    'avulsion fracture',
    'stress fracture',
    'pathological fracture',
    'healthy bone',
  ],

  anatomy: [
    // Bones
    'humerus', 'radius', 'ulna', 'clavicle', 'scapula', 'femur', 'tibia',
    'fibula', 'patella', 'calcaneus', 'talus', 'scaphoid', 'rib', 'sternum',
    'ilium', 'sacrum', 'vertebra', 'metacarpal', 'metatarsal', 'phalanx',
    // Body parts
    'upper arm', 'forearm', 'wrist', 'hand', 'shoulder', 'thigh', 'lower leg',
    'ankle', 'foot', 'pelvis', 'spine', 'chest',
  ],

  knowledge: [
    // Wrong causes
    { category: 'cause',       value: 'infection' },
    { category: 'cause',       value: 'metabolic disease' },
    { category: 'cause',       value: 'repetitive microtrauma' },
    // Wrong treatments
    { category: 'treatment',   value: 'surgical fixation with a plate and screws' },
    { category: 'treatment',   value: 'conservative management with cast immobilisation' },
    { category: 'treatment',   value: 'intramedullary nailing' },
    { category: 'treatment',   value: 'external fixation' },
    { category: 'treatment',   value: 'physiotherapy alone' },
    // Wrong systems
    { category: 'system',      value: 'cardiovascular system' },
    { category: 'system',      value: 'musculoskeletal system' },
    { category: 'system',      value: 'nervous system' },
    // Wrong complications
    { category: 'complication', value: 'avascular necrosis' },
    { category: 'complication', value: 'malunion' },
    { category: 'complication', value: 'nonunion' },
    { category: 'complication', value: 'compartment syndrome' },
    { category: 'complication', value: 'neurovascular injury' },
  ],

  characteristic: [
    { property: 'DISPLACEMENT', correct: 'displaced',                  opposite: 'non-displaced' },
    { property: 'DISPLACEMENT', correct: 'non-displaced',              opposite: 'displaced' },
    { property: 'ALIGNMENT',    correct: 'angulated',                  opposite: 'anatomically aligned' },
    { property: 'ALIGNMENT',    correct: 'anatomically aligned',       opposite: 'angulated' },
    { property: 'FRAGMENTS',    correct: 'comminuted (multiple fragments)', opposite: 'simple (single fracture line)' },
    { property: 'FRAGMENTS',    correct: 'simple (single fracture line)',   opposite: 'comminuted (multiple fragments)' },
    { property: 'CORTEX',       correct: 'disrupted cortex',           opposite: 'intact cortex' },
    { property: 'CORTEX',       correct: 'intact cortex',              opposite: 'disrupted cortex' },
    { property: 'POSITION',     correct: 'overriding',                 opposite: 'end-to-end apposition' },
    { property: 'POSITION',     correct: 'end-to-end apposition',      opposite: 'overriding' },
    { property: 'ROTATION',     correct: 'rotationally deformed',      opposite: 'no rotational deformity' },
    { property: 'ROTATION',     correct: 'no rotational deformity',    opposite: 'rotationally deformed' },
    { property: 'LENGTH',       correct: 'shortened',                  opposite: 'normal length' },
    { property: 'LENGTH',       correct: 'normal length',              opposite: 'shortened' },
  ],

  plane: [
    'AP', 'PA', 'lateral',
    'oblique', 'axial', 'coronal', 'sagittal',
  ],

};

// ── Samplers ──────────────────────────────────────────────────────────────────

/**
 * Sample n unique templates from type × polarity pool.
 */
export function sampleTemplates(type, polarity, n = 3) {
  const pool = QUESTION_TEMPLATES[type]?.[polarity];
  if (!pool?.length) return [];
  const count = Math.min(n, pool.length);
  const copy  = [...pool];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/**
 * Sample n unique negative options for a type.
 * Returns plain strings for most types; objects for 'characteristic' and 'knowledge'.
 */
export function sampleNegativeOption(type, n = 1) {
  const pool = NEGATIVE_OPTIONS[type];
  if (!pool?.length) return [];
  const count = Math.min(n, pool.length);
  const copy  = [...pool];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}