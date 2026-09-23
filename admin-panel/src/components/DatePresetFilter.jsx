import React from 'react';

const DATE_PRESET_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7Days', label: 'Last 7 Days' },
  { value: 'last30Days', label: 'Last 30 Days' },
  { value: 'last90Days', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
];

/**
 * Simple preset dropdown for admin-panel date filtering.
 *
 * Props:
 * - value: string (DatePreset or '')
 * - onChange: (value: string) => void
 * - className?: string
 */
export default function DatePresetFilter({ value, onChange, className }) {
  return (
    <select
      className={
        className ||
        'h-10 rounded-lg border border-stroke bg-white px-3 text-sm text-slate-700'
      }
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {DATE_PRESET_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
