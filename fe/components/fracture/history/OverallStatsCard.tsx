import React from 'react';
import { OverallStats } from '@/hooks/fracture/history';

interface OverallStatsCardProps {
  stats: OverallStats;
}

interface AccuracyCardProps {
  label: string;
  value: number;
  sublabel: string;
  theme: 'green' | 'blue';
}

function AccuracyCard({ label, value, sublabel, theme }: AccuracyCardProps) {
  const pct = Math.min(Math.max(value, 0), 100);

  const themes = {
    green: {
      wrap:    'bg-[#EDF7F1] border-[#A8D5BA]',
      label:   'text-[#2E7D5C]',
      value:   'text-[#1B5E3A]',
      sub:     'text-[#4B9B6E]',
      track:   'bg-[#A8D5BA]/40',
      bar:     'bg-[#2E7D5C]',
    },
    blue: {
      wrap:    'bg-blue-50 border-blue-200',
      label:   'text-blue-600',
      value:   'text-blue-800',
      sub:     'text-blue-400',
      track:   'bg-blue-100',
      bar:     'bg-blue-500',
    },
  };

  const t = themes[theme];

  return (
    <div className={`rounded-xl border p-5 ${t.wrap}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${t.label}`}>{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${t.value}`}>
        {value.toFixed(1)}%
      </p>
      <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${t.track}`}>
        <div
          className={`h-full rounded-full ${t.bar} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`mt-1.5 text-xs ${t.sub}`}>{sublabel}</p>
    </div>
  );
}

function TotalCard({ value }: { value: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 flex flex-col justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Scans</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="mt-3 text-xs text-gray-400">
        {value === 0
          ? 'No scans yet'
          : `${value} scan${value !== 1 ? 's' : ''} analyzed`}
      </p>
    </div>
  );
}

export function OverallStatsCard({ stats }: OverallStatsCardProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <TotalCard value={stats.total_images} />
      <AccuracyCard
        label="Avg IoU Score"
        value={stats.avg_iou_accuracy}
        sublabel="Spatial overlap accuracy"
        theme="green"
      />
      <AccuracyCard
        label="Type Accuracy"
        value={stats.fracture_type_accuracy}
        sublabel="Fracture classification"
        theme="blue"
      />
    </div>
  );
}