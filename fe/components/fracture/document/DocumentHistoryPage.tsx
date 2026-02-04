import React, { useState } from 'react';
import { DocumentUpload } from '@/types';
import { Loader, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface DocumentHistoryPageProps {
  token: string;
  onBack: () => void;
  documents?: DocumentUpload[];
  onRefresh?: () => void;
}

export function DocumentHistoryPage({ 
  onBack, 
  documents = [],
  onRefresh 
}: DocumentHistoryPageProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const getStatusIcon = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader className="w-5 h-5 text-yellow-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedDocuments = {
    processing: documents.filter(d => d.status === 'uploading' || d.status === 'processing'),
    completed: documents.filter(d => d.status === 'completed'),
    failed: documents.filter(d => d.status === 'failed')
  };

  if (documents.length === 0) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Detection
          </button>
          
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Documents Yet</h2>
            <p className="text-gray-600">
              Upload documents to see them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-6 pb-16">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Detection
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Document Upload History
          </h1>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Documents */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-between text-center">
            <div className="flex flex-col items-center">
              <FileText className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm">Total Documents</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-4">{documents.length}</p>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-between text-center">
            <div className="flex flex-col items-center">
              <CheckCircle className="w-12 h-12 text-green-400 mb-2" />
              <p className="text-gray-600 text-sm">Completed</p>
            </div>
            <p className="text-3xl font-bold text-green-600 mt-4">{groupedDocuments.completed.length}</p>
          </div>

          {/* Processing */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-between text-center">
            <div className="flex flex-col items-center">
              <Loader className="w-12 h-12 text-yellow-400 mb-2" />
              <p className="text-gray-600 text-sm">Processing</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600 mt-4">{groupedDocuments.processing.length}</p>
          </div>
        </div>

        {/* Processing Documents */}
        {groupedDocuments.processing.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Documents</h2>
            <div className="space-y-3">
              {groupedDocuments.processing.map((doc) => (
                <div 
                  key={doc.id}
                  className={`rounded-lg border-2 p-4 ${getStatusColor(doc.status)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {doc.filename}
                          </h3>
                          <p className="text-sm mt-1">
                            {formatDate(doc.created_at)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium capitalize whitespace-nowrap">
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Documents */}
        {groupedDocuments.completed.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Documents</h2>
            <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
              {groupedDocuments.completed.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {doc.filename}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Uploaded {formatDate(doc.created_at)}
                          </p>
                          {doc.file_type && (
                            <p className="text-xs text-gray-500 mt-1">
                              Type: {doc.file_type}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium capitalize whitespace-nowrap">
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Documents */}
        {groupedDocuments.failed.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Failed Documents</h2>
            <div className="space-y-3">
              {groupedDocuments.failed.map((doc) => (
                <div 
                  key={doc.id}
                  className={`rounded-lg border-2 p-4 ${getStatusColor(doc.status)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {doc.filename}
                          </h3>
                          <p className="text-sm mt-1">
                            Attempted {formatDate(doc.created_at)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium capitalize whitespace-nowrap">
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}