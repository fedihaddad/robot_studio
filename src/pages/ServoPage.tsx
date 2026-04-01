import React, { useState } from 'react';
import ServoSlider from '../components/shared/ServoSlider';
import IKControlPanel from '../components/shared/IKControlPanel';
import TimeSyncIndicator from '../components/shared/TimeSyncIndicator';
import { ServoCommand, ServoPreset, IKSolution } from '../types';

interface ServoPageProps {
  onServoCommand: (command: ServoCommand) => void;
}

const ServoPage: React.FC<ServoPageProps> = ({ onServoCommand }) => {
  // Head servos: 15 servos for various head movements
  const [headServos, setHeadServos] = useState<Record<number, number>>({
    1: 90, 2: 90, 3: 90, 4: 90, 5: 90,      // Pan/tilt, eye blinks
    6: 90, 7: 90, 8: 90,                      // Mouth
    9: 90, 10: 90, 11: 90, 12: 90, 13: 90,   // Eyebrows, expressions
    14: 90, 15: 90,                            // Additional adjustments
  });

  // Arm servos: MG996R servos for arms
  const [armServos, setArmServos] = useState<Record<number, number>>({
    16: 90, 17: 90, 18: 90, 19: 90, 20: 90,  // Left arm
    21: 90, 22: 90, 23: 90, 24: 90, 25: 90,  // Right arm
  });

  // IK Control state
  const [ikMode, setIkMode] = useState<'direct' | 'inverse_kinematics'>('direct');
  const [isExecutingIK, setIsExecutingIK] = useState(false);

  const presets: Record<string, ServoPreset> = {
    neutral: {
      name: 'Neutral',
      description: 'Default resting position',
      positions: new Map(
        Object.entries({
          1: 90, 2: 90, 3: 90, 4: 90, 5: 90,
          6: 90, 7: 90, 8: 90, 9: 90, 10: 90,
          11: 90, 12: 90, 13: 90, 14: 90, 15: 90,
          16: 90, 17: 90, 18: 90, 19: 90, 20: 90,
          21: 90, 22: 90, 23: 90, 24: 90, 25: 90,
        }).map(([k, v]) => [parseInt(k), v])
      ),
    },
    wave: {
      name: 'Wave',
      description: 'Friendly waving gesture',
      positions: new Map([
        [16, 45], [17, 60], [18, 75], [19, 90], [20, 90],
        [21, 135], [22, 120], [23, 105], [24, 90], [25, 90],
      ]),
    },
    lookLeft: {
      name: 'Look Left',
      description: 'Head turned left',
      positions: new Map(
        Array.from({ length: 25 }, (_, i) => [
          i + 1,
          i + 1 <= 3 ? 45 : 90,
        ])
      ),
    },
    lookRight: {
      name: 'Look Right',
      description: 'Head turned right',
      positions: new Map(
        Array.from({ length: 25 }, (_, i) => [
          i + 1,
          i + 1 <= 3 ? 135 : 90,
        ])
      ),
    },
  };

  const handleHeadServoChange = (id: number, value: number) => {
    setHeadServos(prev => ({ ...prev, [id]: value }));
    onServoCommand({ id, angle: value });
  };

  const handleArmServoChange = (id: number, value: number) => {
    setArmServos(prev => ({ ...prev, [id]: value }));
    onServoCommand({ id, angle: value });
  };

  const applyPreset = (preset: ServoPreset) => {
    const newHead: Record<number, number> = {};
    const newArm: Record<number, number> = {};

    preset.positions.forEach((angle, id) => {
      if (id <= 15) {
        newHead[id] = angle;
      } else {
        newArm[id] = angle;
      }
      onServoCommand({ id, angle });
    });

    setHeadServos(prev => ({ ...prev, ...newHead }));
    setArmServos(prev => ({ ...prev, ...newArm }));
  };

  // Handle IK Solution execution
  const handleIKExecution = (solution: IKSolution, armName: 'left_arm' | 'right_arm') => {
    if (!solution.valid) return;

    setIsExecutingIK(true);

    // Map IK solution angles to servo IDs
    // Left arm: 16-20 (shoulder, elbow, wrist, spare1, spare2)
    // Right arm: 21-25 (shoulder, elbow, wrist, spare1, spare2)
    const baseId = armName === 'left_arm' ? 16 : 21;

    // Execute shoulder move
    onServoCommand({
      id: baseId,
      angle: solution.angles.shoulder,
    });

    // Execute elbow move
    setTimeout(() => {
      onServoCommand({
        id: baseId + 1,
        angle: solution.angles.elbow,
      });
    }, 150);

    // Execute wrist move if available
    if (solution.angles.wrist) {
      setTimeout(() => {
        onServoCommand({
          id: baseId + 2,
          angle: solution.angles.wrist,
        });
      }, 300);
    }

    // Update state
    const newArmServos = {
      [baseId]: solution.angles.shoulder,
      [baseId + 1]: solution.angles.elbow,
      [baseId + 2]: solution.angles.wrist || 90,
    };

    setArmServos(prev => ({ ...prev, ...newArmServos }));

    // Reset executing state after animation
    setTimeout(() => {
      setIsExecutingIK(false);
    }, 500);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Servo Control</h1>
          <p className="text-gray-400">Individual servo angle control and presets</p>
        </div>
        <TimeSyncIndicator showDetails={false} />
      </div>

      {/* Control Mode Toggle */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Control Mode</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIkMode('direct')}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
              ikMode === 'direct'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🎚️ Direct Servo Control
          </button>
          <button
            onClick={() => setIkMode('inverse_kinematics')}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
              ikMode === 'inverse_kinematics'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🎯 Inverse Kinematics
          </button>
        </div>
      </div>

      {/* Preset Buttons - Only in Direct Mode */}
      {ikMode === 'direct' && (
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(preset)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-white flex flex-col items-center gap-1"
            >
              <span className="text-lg">{preset.name}</span>
              <span className="text-xs text-blue-200">{preset.description}</span>
            </button>
          ))}
        </div>
      )}

      {ikMode === 'direct' && (
        <div className="grid grid-cols-2 gap-8">
          {/* Head Servos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗣️</span>
              <h2 className="text-2xl font-bold text-white">Head Servos</h2>
              <span className="text-sm text-gray-400">(15 servos)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((id) => (
                <ServoSlider
                  key={id}
                  id={id}
                  label="Servo"
                  value={headServos[id] || 90}
                  onChange={(value) => handleHeadServoChange(id, value)}
                />
              ))}
            </div>
          </div>

          {/* Arm Servos - Direct */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦾</span>
              <h2 className="text-2xl font-bold text-white">Arm Servos</h2>
              <span className="text-sm text-gray-400">(10 servos)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Left Arm */}
              <div>
                <h3 className="text-sm font-bold text-blue-400 mb-2">Left Arm</h3>
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, i) => 16 + i).map((id) => (
                    <ServoSlider
                      key={id}
                      id={id}
                      label="Left"
                      value={armServos[id] || 90}
                      onChange={(value) => handleArmServoChange(id, value)}
                    />
                  ))}
                </div>
              </div>

              {/* Right Arm */}
              <div>
                <h3 className="text-sm font-bold text-green-400 mb-2">Right Arm</h3>
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, i) => 21 + i).map((id) => (
                    <ServoSlider
                      key={id}
                      id={id}
                      label="Right"
                      value={armServos[id] || 90}
                      onChange={(value) => handleArmServoChange(id, value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {ikMode === 'inverse_kinematics' && (
        <div className="grid grid-cols-2 gap-8">
          {/* Left Arm IK */}
          <IKControlPanel
            armName="left_arm"
            onExecution={(solution) => handleIKExecution(solution, 'left_arm')}
            isExecuting={isExecutingIK}
          />

          {/* Right Arm IK */}
          <IKControlPanel
            armName="right_arm"
            onExecution={(solution) => handleIKExecution(solution, 'right_arm')}
            isExecuting={isExecutingIK}
          />
        </div>
      )}

      {/* Quick Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-3">Servo Information</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Head Servos</p>
            <p className="text-xl font-bold text-blue-400">15x MG90/MG90S</p>
          </div>
          <div>
            <p className="text-gray-400">Arm Servos</p>
            <p className="text-xl font-bold text-green-400">10x MG996R</p>
          </div>
          <div>
            <p className="text-gray-400">Control Interface</p>
            <p className="text-xl font-bold text-yellow-400">2x PCA9685</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServoPage;
