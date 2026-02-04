import React from 'react';
import { DocumentUpload } from '@/types';

interface DocumentHistorySectionProps {
  onNavigateToHistory: () => void;
  recentDocuments?: DocumentUpload[];
  isLoading?: boolean;
}

export function DocumentHistorySection({ 
  onNavigateToHistory,
  recentDocuments = []
}: DocumentHistorySectionProps) {
  const processingDocs = recentDocuments.filter(
    doc => doc.status === 'uploading' || doc.status === 'processing'
  );
  
  const completedCount = recentDocuments.filter(doc => doc.status === 'completed').length;
  const failedCount = recentDocuments.filter(doc => doc.status === 'failed').length;

  return (
    <div 
      className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border-2 border-green-200 hover:border-green-300 transition-all cursor-pointer hover:shadow-md"
      onClick={onNavigateToHistory}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-bold text-gray-900 text-base">Document Upload History</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            View all your uploaded documents and their processing status
          </p>
          
          {/* Status Summary */}
          {recentDocuments.length > 0 && (
            <div className="flex items-center gap-4 text-xs">
              {processingDocs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-700 font-medium">
                    {processingDocs.length} {processingDocs.length === 1 ? 'Processing' : 'Processing'}
                  </span>
                </div>
              )}
              {completedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">
                    {completedCount} Completed
                  </span>
                </div>
              )}
              {failedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">
                    {failedCount} Failed
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Processing Documents List */}
          {processingDocs.length > 0 && (
            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              {processingDocs.map((doc) => (
                <div 
                  key={`${doc.id}-${doc.filename}`}
                  className="bg-white/60 rounded px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium truncate flex-1">
                      {doc.filename}
                    </span>
                    <span className="text-yellow-700 text-xs capitalize whitespace-nowrap">
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <svg 
          className="w-6 h-6 text-green-600 flex-shrink-0 ml-3" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}