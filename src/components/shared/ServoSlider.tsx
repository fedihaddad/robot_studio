import React from 'react';

interface ServoSliderProps {
  id: number;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const ServoSlider: React.FC<ServoSliderProps> = ({
  id,
  label,
  value,
  min = 0,
  max = 180,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-2xl border"
      style={{
        background: 'var(--axel-surface-soft)',
        borderColor: 'var(--axel-border)',
        color: 'var(--axel-text)',
      }}
    >
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold" style={{ color: 'var(--axel-text)' }}>
          {label} <span className="axel-muted">#{id}</span>
        </label>
        <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-300">{value}°</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'rgba(148, 163, 184, 0.25)' }}
      />
      <div className="flex justify-between text-xs axel-muted">
        <span>{min}°</span>
        <span>{max}°</span>
      </div>
    </div>
  );
};

export default ServoSlider;
