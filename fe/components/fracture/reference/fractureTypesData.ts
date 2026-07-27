export interface FractureType {
  name: string;
  displayName: string;
  description: string;
  characteristics: string[];
  imagePath: string;
}

export const fractureTypes: FractureType[] = [
  {
    name: 'comminuted',
    displayName: 'Comminuted Fracture',
    description: 'A fracture in which the bone is broken into three or more pieces.',
    characteristics: [
      'Multiple bone fragments',
      'Often caused by high-energy trauma',
      'May require surgical intervention',
      'Common in accidents or severe impacts'
    ],
    imagePath: '/comminuted.jpg'
  },
  {
    name: 'transverse',
    displayName: 'Transverse Fracture',
    description: 'A fracture that occurs straight across the bone, perpendicular to the long axis.',
    characteristics: [
      'Horizontal break line',
      'Usually caused by direct force',
      'Clean break pattern',
      'Relatively stable fracture type'
    ],
    imagePath: '/transverse.jpg'
  },
  {
    name: 'spiral',
    displayName: 'Spiral Fracture',
    description: 'A fracture that spirals around the bone shaft, often from twisting force.',
    characteristics: [
      'Curved, spiral break pattern',
      'Caused by rotational or twisting force',
      'Common in sports injuries',
      'May be unstable'
    ],
    imagePath: '/spiral.jpg'
  },
  {
    name: 'oblique',
    displayName: 'Oblique Fracture',
    description: 'A fracture that runs at an angle across the bone.',
    characteristics: [
      'Diagonal break line',
      'Angled fracture pattern',
      'Caused by angled or indirect force',
      'May be difficult to stabilize'
    ],
    imagePath: '/oblique.jpg'
  },
  {
    name: 'greenstick',
    displayName: 'Greenstick Fracture',
    description: 'An incomplete fracture where the bone bends and cracks, but does not break completely.',
    characteristics: [
      'Partial break, bone bends',
      'Common in children',
      'Bone flexibility causes incomplete break',
      'Usually heals well with immobilization'
    ],
    imagePath: '/greenstick.jpg'
  }
];