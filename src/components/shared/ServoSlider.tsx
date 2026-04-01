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
    <div className="flex flex-col gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">
          {label} #{id}
        </label>
        <span className="text-lg font-bold text-blue-400">{value}°</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}°</span>
        <span>{max}°</span>
      </div>
    </div>
  );
};

export default ServoSlider;
