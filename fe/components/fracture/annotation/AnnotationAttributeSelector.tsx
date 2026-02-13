import React from 'react';
import { StudentAnnotation } from '@/types/fracture';

interface AnnotationAttributeSelectorProps {
  annotations: StudentAnnotation[];
  onUpdateAnnotation: (annotation: StudentAnnotation) => void;
  onRemoveAnnotation: (id: string) => void;
  isAnnotating: boolean;
}

// model prediction classes: {0: 'comminuted', 1: 'greenstick', 2: 'oblique', 3: 'spiral', 4: 'transverse'}
const FRACTURE_TYPES = [
  { value: '', label: 'Select fracture type...' },
  { value: 'comminuted', label: 'Comminuted' },
  { value: 'greenstick', label: 'Greenstick' },
  { value: 'oblique', label: 'Oblique' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'transverse', label: 'Transverse' }
];

export function AnnotationAttributeSelector({
  annotations,
  onUpdateAnnotation,
  onRemoveAnnotation,
  isAnnotating
}: AnnotationAttributeSelectorProps) {
  if (annotations.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm">Annotation Attributes</h4>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            {isAnnotating 
              ? 'Draw on the image to create annotations' 
              : 'No annotations yet'}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            If you see no fractures, you can submit without annotations
          </p>
        </div>
      </div>
    );
  }

  const allAnnotationsComplete = annotations.every(
    ann => ann.fracture_type
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 text-sm">
          Annotation Attributes ({annotations.length})
        </h4>
        {!allAnnotationsComplete && (
          <span className="text-xs text-red-600 font-medium">
            Incomplete
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {annotations.map((annotation, index) => {
          const isComplete = annotation.fracture_type;
          
          return (
            <div 
              key={annotation.id} 
              className={`bg-white rounded-lg p-3 border-2 ${
                isComplete ? 'border-green-300' : 'border-yellow-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    Annotation #{index + 1}
                  </span>
                  {isComplete && (
                    <span className="text-green-600 text-xs">✓</span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveAnnotation(annotation.id)}
                  className="text-red-600 hover:text-red-800 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {/* Fracture Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">
                    Fracture Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={annotation.fracture_type || ''}
                    onChange={(e) => onUpdateAnnotation({
                      ...annotation,
                      fracture_type: e.target.value
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    {FRACTURE_TYPES.map(type => (
                      <option key={type.value} value={type.value} className="text-gray-900">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={annotation.notes || ''}
                    onChange={(e) => onUpdateAnnotation({
                      ...annotation,
                      notes: e.target.value
                    })}
                    placeholder="Add observations..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white"
                  />
                </div>

                {/* Size Info */}
                <div className="text-xs text-gray-600 pt-1">
                  Size: {Math.round(annotation.width)}×{Math.round(annotation.height)}px
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!allAnnotationsComplete && (
        <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
          <p className="text-yellow-800 text-xs">
            Please select fracture type for all annotations
          </p>
        </div>
      )}
    </div>
  );
}