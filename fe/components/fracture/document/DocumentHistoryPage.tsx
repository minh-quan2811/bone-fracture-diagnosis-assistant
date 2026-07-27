import React, { useState } from 'react';
import { DocumentUpload } from '@/types';

interface DocumentHistoryPageProps {
  token: string;
  onBack: () => void;
  documents?: DocumentUpload[];
  onRefresh?: () => void;
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

// ── Status config

type Status = DocumentUpload['status'];

function getStatusConfig(status: Status) {
  switch (status) {
    case 'uploading':
    case 'processing':
      return {
        icon: <IconSpinner className="w-3.5 h-3.5 animate-spin" />,
        badge: 'text-amber-700 bg-amber-50 border-amber-200',
        label: status === 'uploading' ? 'Uploading' : 'Processing',
      };
    case 'completed':
      return {
        icon: <IconCheck className="w-3.5 h-3.5" />,
        badge: 'text-[#1B5E3A] bg-[#EDF7F1] border-[#A8D5BA]',
        label: 'Completed',
      };
    case 'failed':
      return {
        icon: <IconAlert className="w-3.5 h-3.5" />,
        badge: 'text-red-700 bg-red-50 border-red-200',
        label: 'Failed',
      };
    default:
      return {
        icon: <IconClock className="w-3.5 h-3.5" />,
        badge: 'text-gray-600 bg-gray-100 border-gray-200',
        label: 'Pending',
      };
  }
}

// ── Shared sub-components

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-150 group"
    >
      <svg
        className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Detection
    </button>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const { icon, badge, label } = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge}`}
    >
      {icon}
      {label}
    </span>
  );
}

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h2>
      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
        {count}
      </span>
    </div>
  );
}

function DocRow({ doc, isLast }: { doc: DocumentUpload; isLast: boolean }) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors duration-100 ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      {/* Doc icon */}
      <div className="flex-shrink-0 text-gray-300">
        <IconDocument className="w-4 h-4" />
      </div>

      {/* Filename + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {doc.file_type ? `${doc.file_type.toUpperCase()} · ` : ''}
          {formatDate(doc.created_at)}
        </p>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <StatusBadge status={doc.status} />
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-bold tabular-nums ${
          accent ? 'text-[#2E7D5C]' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ── Main component

export function DocumentHistoryPage({
  onBack,
  documents = [],
  onRefresh,
}: DocumentHistoryPageProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const grouped = {
    processing: documents.filter(d => d.status === 'uploading' || d.status === 'processing'),
    completed:  documents.filter(d => d.status === 'completed'),
    failed:     documents.filter(d => d.status === 'failed'),
  };

  if (documents.length === 0) {
    return (
      <div className="h-full bg-white overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
          <BackButton onClick={onBack} />
          <div className="mt-12 py-20 text-center">
            <div className="w-10 h-10 mx-auto mb-4 text-gray-300">
              <IconDocument className="w-10 h-10" />
            </div>
            <p className="text-sm font-semibold text-gray-900">No documents uploaded</p>
            <p className="text-sm text-gray-400 mt-1">
              Upload a document to see it tracked here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-6 space-y-6 pb-16">

        {/* Back */}
        <BackButton onClick={onBack} />

        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Document Uploads
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {documents.length} document{documents.length !== 1 ? 's' : ''} total
            </p>
          </div>

          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#2E7D5C] hover:bg-[#1B5E3A] disabled:opacity-60 rounded-xl transition-colors duration-150"
            >
              <IconRefresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-300">
          <StatCell label="Total" value={documents.length} />
          <StatCell label="Completed" value={grouped.completed.length} accent />
          <StatCell label="Processing" value={grouped.processing.length} />
        </div>

        {/* Processing section */}
        {grouped.processing.length > 0 && (
          <section className="space-y-3">
            <SectionLabel title="Processing" count={grouped.processing.length} />
            <div className="border-2 border-amber-300 rounded-xl overflow-hidden bg-amber-50/40">
              {grouped.processing.map((doc, i) => (
                <DocRow key={doc.id} doc={doc} isLast={i === grouped.processing.length - 1} />
              ))}
            </div>
          </section>
        )}

        {/* Completed section */}
        {grouped.completed.length > 0 && (
          <section className="space-y-3">
            <SectionLabel title="Completed" count={grouped.completed.length} />
            <div className="border-2 border-[#A8D5BA] rounded-xl overflow-hidden">
              {grouped.completed.map((doc, i) => (
                <DocRow key={doc.id} doc={doc} isLast={i === grouped.completed.length - 1} />
              ))}
            </div>
          </section>
        )}

        {/* Failed section */}
        {grouped.failed.length > 0 && (
          <section className="space-y-3">
            <SectionLabel title="Failed" count={grouped.failed.length} />
            <div className="border-2 border-red-300 rounded-xl overflow-hidden bg-red-50/30">
              {grouped.failed.map((doc, i) => (
                <DocRow key={doc.id} doc={doc} isLast={i === grouped.failed.length - 1} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}