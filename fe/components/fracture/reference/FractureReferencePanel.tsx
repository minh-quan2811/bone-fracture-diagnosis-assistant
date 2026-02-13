import React from 'react';

interface FractureType {
  name: string;
  displayName: string;
  description: string;
  characteristics: string[];
  imagePath: string;
}

const fractureTypes: FractureType[] = [
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

export function FractureReferencePanel() {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-300 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b-2 border-gray-300">
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Fracture Type Reference
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          Review common fracture patterns before making your prediction
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto max-h-[600px] p-4 space-y-4">
        {fractureTypes.map((fracture, index) => (
          <div 
            key={fracture.name}
            className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="flex items-stretch">
              {/* Image */}
              <div className="w-[45%] flex-shrink-0 bg-gray-100 flex items-center justify-center min-h-[160px]">
                <img
                  src={fracture.imagePath}
                  alt={`${fracture.displayName} example`}
                  className="w-full h-full object-contain max-h-[240px]"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center justify-center text-gray-400 p-4">
                          <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p class="text-xs">Image not available</p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>

              {/* Description */}
              <div className="p-4 flex flex-col justify-center">
                <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  {fracture.displayName}
                </h4>
                
                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                  {fracture.description}
                </p>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-800">Key Characteristics:</p>
                  <ul className="space-y-0.5">
                    {fracture.characteristics.map((char, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="bg-blue-50 px-4 py-2 border-t border-gray-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> These images are for reference only. Your uploaded X-ray may show variations of these patterns.
        </p>
      </div>
    </div>
  );
}