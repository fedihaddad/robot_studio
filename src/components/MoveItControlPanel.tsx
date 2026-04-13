/**
 * MoveIt Control Panel Component
 * UI for controlling all 53 joints via MoveIt planning groups
 */

import React, { useState, useEffect } from 'react';
import { moveItService } from '../services/moveItService';

interface ControlPanelProps {
  enabled?: boolean;
}

export const MoveItControlPanel: React.FC<ControlPanelProps> = ({ enabled = true }) => {
  const [selectedGroup, setSelectedGroup] = useState('right_arm');
  const [jointAngles, setJointAngles] = useState<number[]>([0, 0, 0, 0, 0]);
  const [duration, setDuration] = useState(2.0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready');

  const planningGroups = [
    { id: 'right_arm', label: '💪 Right Arm', joints: 5 },
    { id: 'left_arm', label: '💪 Left Arm', joints: 5 },
    { id: 'head', label: '🗣️ Head', joints: 3 },
    { id: 'face', label: '😊 Face & Eyes', joints: 4 },
    { id: 'torso', label: '🟡 Torso', joints: 2 },
    { id: 'right_hand', label: '✋ Right Hand', joints: 17 },
    { id: 'left_hand', label: '✋ Left Hand', joints: 17 },
  ];

  const currentGroup = planningGroups.find((g) => g.id === selectedGroup);
  const jointCount = currentGroup?.joints || 5;

  // Update angle array when group changes
  useEffect(() => {
    setJointAngles(Array(jointCount).fill(0));
  }, [selectedGroup, jointCount]);

  const handleMove = async () => {
    setLoading(true);
    setStatus('Moving...');
    try {
      await moveItService.moveGroup(selectedGroup, jointAngles, duration);
      setStatus('✅ Movement complete!');
      setTimeout(() => setStatus('Ready'), 2000);
    } catch (error) {
      setStatus(`❌ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = async (preset: 'home' | 'rest' | 'grasp') => {
    setLoading(true);
    setStatus(`Moving to ${preset}...`);
    try {
      await moveItService.moveToPreset(preset);
      setStatus(`✅ Moved to ${preset}!`);
      setTimeout(() => setStatus('Ready'), 2000);
    } catch (error) {
      setStatus(`❌ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAngleChange = (index: number, value: string) => {
    const newAngles = [...jointAngles];
    newAngles[index] = parseFloat(value) || 0;
    setJointAngles(newAngles);
  };

  const handleReset = () => {
    setJointAngles(Array(jointCount).fill(0));
    setStatus('Reset to zeros');
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg shadow-2xl border border-blue-900">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">🤖 MoveIt Control Center</h2>
        <p className="text-gray-400">Control all 53 joints across 7 planning groups</p>
      </div>

      {/* Status Bar */}
      <div className="mb-6 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-300">
          Status: <span className="font-semibold text-blue-400">{status}</span>
        </p>
      </div>

      {/* Group Selection */}
      <div className="mb-6">
        <label className="block text-lg font-semibold text-white mb-3">Select Planning Group:</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {planningGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`p-3 rounded-lg font-semibold transition-colors ${
                selectedGroup === group.id
                  ? 'bg-blue-600 text-white border-2 border-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
              }`}
              disabled={loading}
            >
              {group.label}
              <div className="text-xs text-gray-200">{group.joints} joints</div>
            </button>
          ))}
        </div>
      </div>

      {/* Joint Angle Sliders */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Joint Angles for {currentGroup?.label} ({jointCount} joints)
        </h3>

        <div className="space-y-3">
          {jointAngles.map((angle, index) => (
            <div key={index} className="flex items-center gap-4">
              <label className="w-20 text-sm font-semibold text-gray-300">J{index + 1}:</label>
              <input
                type="range"
                min="-3.14"
                max="3.14"
                step="0.1"
                value={angle}
                onChange={(e) => handleAngleChange(index, e.target.value)}
                disabled={loading}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                min="-3.14"
                max="3.14"
                step="0.1"
                value={angle.toFixed(2)}
                onChange={(e) => handleAngleChange(index, e.target.value)}
                disabled={loading}
                className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
              />
              <span className="w-16 text-right text-sm text-gray-400">
                {((angle * 180) / Math.PI).toFixed(0)}°
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Duration Slider */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <label className="block text-lg font-semibold text-white mb-3">Movement Duration:</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            disabled={loading}
            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-20 text-right font-semibold text-blue-400">{duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <button
            onClick={handleMove}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Moving...' : '🚀 Move Group'}
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↺ Reset to Zero
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300">Presets:</h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePreset('home')}
              disabled={loading}
              className="py-2 px-2 bg-green-700 hover:bg-green-600 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🏠 Home
            </button>
            <button
              onClick={() => handlePreset('rest')}
              disabled={loading}
              className="py-2 px-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              😴 Rest
            </button>
            <button
              onClick={() => handlePreset('grasp')}
              disabled={loading}
              className="py-2 px-2 bg-orange-700 hover:bg-orange-600 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✊ Grasp
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
        <p className="text-sm text-blue-300">
          <strong>💡 Tip:</strong> Use sliders to set desired angles in radians. Duration controls how long the
          movement takes. Presets move the entire upper body to predefined poses.
        </p>
      </div>
    </div>
  );
};

// Example usage in main Dashboard:
export const DashboardWithMoveIt = () => (
  <div className="p-4 space-y-4">
    <h1 className="text-4xl font-bold">AXEL Dashboard</h1>
    <MoveItControlPanel enabled={true} />
  </div>
);
