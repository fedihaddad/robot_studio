import React from 'react';
import { StopCircleIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/appStore';

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
  const { t } = useAppStore();
  return (
    <button
      type="button"
      onClick={() => onToggle(!active)}
      disabled={disabled}
      className={`
        min-w-[200px] py-3 px-4 rounded-lg font-bold text-base transition-all duration-200
        flex items-center justify-center gap-2
        ${
          active
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/50 animate-pulse'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {active ? (
        <>
          <StopCircleIcon className="w-6 h-6 shrink-0" aria-hidden />
          <span>{t('demo.estopActive', 'Emergency stop active')}</span>
        </>
      ) : (
        <>
          <HandRaisedIcon className="w-6 h-6 shrink-0" aria-hidden />
          <span>{t('dashboard.emergencyStop', 'Emergency stop')}</span>
        </>
      )}
    </button>
  );
};

export default EmergencyStopButton;
