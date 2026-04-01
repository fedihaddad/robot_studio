import React, { useState } from 'react';
import ServoSlider from '../components/shared/ServoSlider';
import { useServoControl } from '../hooks/useServoControl';
import { ServoCommand } from '../types';
import { ROSService } from '../services/ros.service';
import { getServoConfig } from '../config/servoDegrees.config';

interface ManualServoControlPageProps {
  joints?: Record<number, number>;
  onServoCommand?: (command: ServoCommand) => void;
  rosService: ROSService | null;
}

// Servo configuration with body parts and angle ranges
interface ServoGroup {
  name: string;
  icon: string;
  servos: Array<{
    id: number;
    label: string;
  }>;
}

const servoGroups: ServoGroup[] = [
  {
    name: 'Left Eye (العين اليسرى)',
    icon: '👁️',
    servos: [
      { id: 1, label: 'Left/Right (جانبي)' },
      { id: 2, label: 'Up/Down (علوي سفلي)' },
      { id: 3, label: 'Top Lid (الجفن العلوي)' },
      { id: 4, label: 'Bottom Lid (الجفن السفلي)' },
    ],
  },
  {
    name: 'Right Eye (العين اليمنى)',
    icon: '👁️',
    servos: [
      { id: 5, label: 'Left/Right (جانبي)' },
      { id: 6, label: 'Up/Down (علوي سفلي)' },
      { id: 7, label: 'Top Lid (الجفن العلوي)' },
      { id: 8, label: 'Bottom Lid (الجفن السفلي)' },
    ],
  },
  {
    name: 'Mouth (الفم)',
    icon: '👄',
    servos: [
      { id: 9, label: 'Open/Close' },
    ],
  },
  {
    name: 'Eyebrows (الحواجب)',
    icon: '🤨',
    servos: [
      { id: 10, label: 'Left Eyebrow (الحاجب الأيسر)' },
      { id: 11, label: 'Right Eyebrow (الحاجب الأيمن)' },
    ],
  },
  {
    name: 'Head Pan/Tilt (رأس)',
    icon: '🧠',
    servos: [
      { id: 12, label: 'Pan Left/Right' },
    ],
  },
  {
    name: 'Cheeks (الخد)',
    icon: '😊',
    servos: [
      { id: 13, label: 'Smile/Cheek' },
    ],
  },
  {
    name: 'Jaw (الفك)',
    icon: '🗣️',
    servos: [
      { id: 14, label: 'Right Jaw (الفك الأيمن)' },
      { id: 15, label: 'Left Jaw (الفك الأيسر)' },
    ],
  },
];

const ManualServoControlPage: React.FC<ManualServoControlPageProps> = ({
  joints = {},
  onServoCommand,
  rosService,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(servoGroups.map(g => g.name))
  );
  const [selectedPreset, setSelectedPreset] = useState<string>('neutral');

  const {
    servoStates,
    isConnected,
    sendCommand,
  } = useServoControl({
    rosService,
    enabled: true,
  });

  const handleServoChange = (servoId: number, angle: number) => {
    const command: ServoCommand = { id: servoId, angle };
    sendCommand(command);
    onServoCommand?.(command);
  };

  const toggleGroup = (groupName: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(groupName)) {
      newSet.delete(groupName);
    } else {
      newSet.add(groupName);
    }
    setExpandedGroups(newSet);
  };

  const resetGroup = (group: ServoGroup) => {
    // Reset all servos in a group to their default/center position
    group.servos.forEach((servo) => {
      const config = getServoConfig(servo.id);
      handleServoChange(servo.id, config.default);
    });
  };

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    
    // Send all servos to default position or preset values
    if (preset === 'neutral') {
      servoGroups.forEach(group => {
        group.servos.forEach(servo => {
          const config = getServoConfig(servo.id);
          handleServoChange(servo.id, config.default);
        });
      });
    } else if (preset === 'smile') {
      // Smile preset
      handleServoChange(9, 45);  // Left eyebrow up
      handleServoChange(10, 45); // Right eyebrow up
      handleServoChange(11, 120); // Jaw open
      handleServoChange(13, 60); // Cheeks up (smile)
    } else if (preset === 'sad') {
      // Sad preset
      handleServoChange(9, 135);  // Left eyebrow down
      handleServoChange(10, 135); // Right eyebrow down
      handleServoChange(11, 60);  // Jaw close
      handleServoChange(13, 120); // Cheeks down
    } else if (preset === 'surprised') {
      // Surprised preset
      handleServoChange(1, 30);   // Left eye wide open
      handleServoChange(5, 30);   // Right eye wide open
      handleServoChange(9, 30);   // Left eyebrow up
      handleServoChange(10, 30);  // Right eyebrow up
      handleServoChange(11, 120); // Jaw open
    } else if (preset === 'angry') {
      // Angry preset
      handleServoChange(1, 150);  // Left eye narrow
      handleServoChange(5, 150);  // Right eye narrow
      handleServoChange(9, 135);  // Left eyebrow down
      handleServoChange(10, 135); // Right eyebrow down
      handleServoChange(13, 140); // Cheeks tense
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Manual Servo Control</h1>
          <p className="text-gray-400">
            Control each facial servo individually
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Reset all servos to their default positions
              servoGroups.forEach((group) => {
                group.servos.forEach((servo) => {
                  const config = getServoConfig(servo.id);
                  handleServoChange(servo.id, config.default);
                });
              });
            }}
            className="px-4 py-2 bg-orange-900 hover:bg-orange-800 text-orange-300 rounded-lg font-semibold transition-colors"
            title="Reset ALL servos to center position"
          >
            🔄 Reset All
          </button>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            isConnected 
              ? 'bg-green-900 text-green-300' 
              : 'bg-red-900 text-red-300'
          }`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-200">
            ⚠️ ROS2 Bridge not connected. Make sure rosbridge is running on your Raspberry Pi.
          </p>
        </div>
      )}

      {/* Presets */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-bold text-white mb-4">😊 Quick Presets</h2>
        <div className="grid grid-cols-5 gap-3">
          {[
            { id: 'neutral', label: '😐 Neutral', emoji: '😐' },
            { id: 'smile', label: '😊 Smile', emoji: '😊' },
            { id: 'sad', label: '😢 Sad', emoji: '😢' },
            { id: 'surprised', label: '😲 Surprised', emoji: '😲' },
            { id: 'angry', label: '😠 Angry', emoji: '😠' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                selectedPreset === preset.id
                  ? 'bg-blue-600 text-white border-2 border-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent'
              }`}
            >
              <div className="text-xl mb-1">{preset.emoji}</div>
              <div className="text-xs">{preset.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Servo Groups */}
      <div className="space-y-4">
        {servoGroups.map((group) => (
          <div key={group.name} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {/* Group Header */}
            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors border-b border-gray-700">
              <button
                onClick={() => toggleGroup(group.name)}
                className="flex-1 flex items-center gap-3 cursor-pointer"
              >
                <span className="text-2xl">{group.icon}</span>
                <h3 className="text-lg font-bold text-white">{group.name}</h3>
                <span className="text-sm text-gray-400">({group.servos.length} servos)</span>
                <span className={`text-xl transition-transform ml-auto ${expandedGroups.has(group.name) ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {/* Reset Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetGroup(group);
                }}
                className="ml-4 px-3 py-2 bg-green-900 hover:bg-green-800 text-green-300 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                title={`Reset all servos in ${group.name} to center position`}
              >
                🔄 Reset
              </button>
            </div>

            {/* Group Content */}
            {expandedGroups.has(group.name) && (
              <div className="px-6 py-4 bg-gray-750 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.servos.map((servo) => {
                    const config = getServoConfig(servo.id);
                    return (
                      <ServoSlider
                        key={servo.id}
                        id={servo.id}
                        label={servo.label}
                        value={servoStates[servo.id]?.angle || config.default}
                        min={config.min}
                        max={config.max}
                        onChange={(value) => handleServoChange(servo.id, value)}
                        disabled={!isConnected}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-3">📖 Instructions</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>✓ Click on a group to expand/collapse servo controls</li>
          <li>✓ Use presets for quick facial expressions</li>
          <li>✓ Drag sliders to adjust individual servo angles</li>
          <li>✓ All changes are sent in real-time to your Raspberry Pi</li>
          <li>✓ Min/Max angles will be customized with exact degrees per servo</li>
        </ul>
      </div>

      {/* Note for Configuration */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          💡 <strong>Next Step:</strong> You'll provide the exact min/max degrees for each servo. 
          The current ranges (0-180°) are placeholders and will be updated with your specific hardware configuration.
        </p>
      </div>
    </div>
  );
};

export default ManualServoControlPage;
