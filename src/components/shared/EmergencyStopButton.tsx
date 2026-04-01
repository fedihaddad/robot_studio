import React from 'react';

interface EmergencyStopButtonProps {
  active: boolean;
  onToggle: (active: boolean) => void;
  disabled?: boolean;
}

const EmergencyStopButton: React.FC<EmergencyStopButtonProps> = ({
  active,
  onToggle,
  disabled = false,
}) => {
  return (
    <button
      onClick={() => onToggle(!active)}
      disabled={disabled}
      className={`
        w-full py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200
        flex items-center justify-center gap-2
        ${
          active
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/50 animate-pulse'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className={`w-4 h-4 rounded-full ${active ? 'bg-red-400' : 'bg-gray-500'}`} />
      {active ? '🛑 EMERGENCY STOP ACTIVE' : '⏸ Emergency Stop'}
    </button>
  );
};

export default EmergencyStopButton;
