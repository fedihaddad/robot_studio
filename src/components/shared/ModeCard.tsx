import React, { useState } from 'react';
import { RobotMode } from '../../types';
import { ROBOT_MODES, getModeCapabilities } from '../../config/robotModes.config';
import { useAppStore } from '../../store/appStore';
import ModeIcon from './ModeIcon';

interface ModeCardProps {
  onModeChange?: (mode: RobotMode) => Promise<boolean>;
  isConnected?: boolean;
}

const ModeCard: React.FC<ModeCardProps> = ({ onModeChange, isConnected = true }) => {
  const { currentMode, setCurrentMode, saveModePreference } = useAppStore();
  const [isChanging, setIsChanging] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const modeCapabilities = getModeCapabilities(currentMode);

  const handleModeChange = async (newMode: RobotMode) => {
    if (newMode === currentMode) {
      setShowModeSelector(false);
      return;
    }

    setIsChanging(true);
    try {
      // Try to publish to robot first if connected
      let success = false;
      if (onModeChange && isConnected) {
        success = await onModeChange(newMode);
      } else {
        success = true; // Allow local-only mode changes
      }

      if (success || !isConnected) {
        // Update local state regardless of robot connection
        setCurrentMode(newMode);
        saveModePreference();
      }
    } catch (error) {
      console.error('Error changing mode:', error);
    } finally {
      setIsChanging(false);
      setShowModeSelector(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <ModeIcon iconName={modeCapabilities.icon} className="w-6 h-6" />
            Robot Mode
          </h3>
          <p className="text-xs text-gray-400 mt-1">Switch operational mode</p>
        </div>
        {!isConnected && (
          <div className="px-3 py-1 bg-yellow-600/30 text-yellow-300 rounded-full text-xs font-semibold flex items-center gap-1">
            <span>⚠️</span>
            <span>Local Only</span>
          </div>
        )}
      </div>

      {/* Current Mode Display */}
      <div className={`relative overflow-hidden rounded-lg border ${modeCapabilities.borderColor} ${modeCapabilities.bgColor} p-4 mb-4 transition-all duration-300`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Current Mode</p>
            <p className={`text-2xl font-bold ${modeCapabilities.color} flex items-center gap-2`}>
              {modeCapabilities.label}
            </p>
            <p className="text-xs text-gray-400 mt-2 max-w-xs">
              {modeCapabilities.description}
            </p>
          </div>
          <div className={`${modeCapabilities.color} opacity-20 ml-4`}>
            <ModeIcon iconName={modeCapabilities.icon} className="w-16 h-16" />
          </div>
        </div>

        {/* Mode Constraints */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-xs">
            <span className="text-gray-400">Physical Actions: </span>
            <span className={modeCapabilities.allowPhysicalActions ? 'text-green-400' : 'text-red-400'}>
              {modeCapabilities.allowPhysicalActions ? '✓ Enabled' : '✗ Disabled'}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-gray-400">Web Search: </span>
            <span className={modeCapabilities.allowWebSearch ? 'text-green-400' : 'text-red-400'}>
              {modeCapabilities.allowWebSearch ? '✓ Enabled' : '✗ Disabled'}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-gray-400">Vision Analysis: </span>
            <span className={modeCapabilities.allowVisionAnalysis ? 'text-green-400' : 'text-red-400'}>
              {modeCapabilities.allowVisionAnalysis ? '✓ Enabled' : '✗ Disabled'}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-gray-400">Safety Level: </span>
            <span className={`${
              modeCapabilities.safetyLevel === 'high' ? 'text-green-400' :
              modeCapabilities.safetyLevel === 'medium' ? 'text-yellow-400' :
              'text-orange-400'
            }`}>
              {modeCapabilities.safetyLevel.charAt(0).toUpperCase() + modeCapabilities.safetyLevel.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="relative">
        <button
          onClick={() => setShowModeSelector(!showModeSelector)}
          disabled={isChanging}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            isChanging
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-cyan-500/50'
          }`}
        >
          <span>{showModeSelector ? '✕' : '⚙️'}</span>
          <span>{isChanging ? 'Switching Mode...' : 'Switch Mode'}</span>
        </button>

        {/* Mode Dropdown */}
        {showModeSelector && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {Object.values(ROBOT_MODES).map((mode) => {
                const isActive = mode.mode === currentMode;
                return (
                  <button
                    key={mode.mode}
                    onClick={() => handleModeChange(mode.mode as RobotMode)}
                    disabled={isChanging || isActive}
                    className={`w-full px-4 py-3 text-left border-b border-gray-700/50 transition-all last:border-b-0 ${
                      isActive
                        ? `${mode.bgColor} ${mode.borderColor} border-l-4 border-l-current`
                        : 'hover:bg-gray-700/50'
                    } ${isChanging || isActive ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ModeIcon iconName={mode.icon} className={`w-5 h-5 ${mode.color}`} />
                        <div>
                          <p className={`font-semibold ${mode.color}`}>
                            {mode.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {mode.description}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-lg ml-2">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-gray-700/20 rounded-lg border border-gray-700/30">
        <p className="text-xs text-gray-400">
          <span className="text-gray-300 font-semibold">💡 Tip:</span> Mode changes affect robot behavior and constraints. Some modes restrict physical actions for safety.
        </p>
      </div>
    </div>
  );
};

export default ModeCard;
