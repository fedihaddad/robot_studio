import React, { useState, useEffect } from 'react';
import { IKTarget, Vector3, IKSolution } from '../../types';
import { ikSolver } from '../../services/inverseKinematics.service';

interface IKControlPanelProps {
  armName: 'left_arm' | 'right_arm';
  onExecution: (solution: IKSolution) => void;
  isExecuting?: boolean;
}

const IKControlPanel: React.FC<IKControlPanelProps> = ({
  armName,
  onExecution,
  isExecuting = false,
}) => {
  const [target, setTarget] = useState<Vector3>({
    x: 150,
    y: 0,
    z: 100,
  });

  const [solution, setSolution] = useState<IKSolution | null>(null);
  const [workspaceVisualization, setWorkspaceVisualization] = useState<string>('');

  // Calculate IK whenever target changes
  useEffect(() => {
    const ikTarget: IKTarget = {
      position: target,
      orientation: { roll: 0, pitch: 0, yaw: 0 },
    };

    const result =
      armName === 'left_arm'
        ? ikSolver.solveLeftArm(ikTarget)
        : ikSolver.solveRightArm(ikTarget);

    setSolution(result);
  }, [target, armName]);

  const handleTargetChange = (axis: keyof Vector3, value: number) => {
    setTarget(prev => ({
      ...prev,
      [axis]: value,
    }));
  };

  const handleExecute = () => {
    if (solution?.valid) {
      onExecution(solution);
    }
  };

  const handlePreset = (preset: 'home' | 'reach_forward' | 'reach_up' | 'reach_side') => {
    const presets: Record<string, Vector3> = {
      home: { x: 100, y: 0, z: 80 },
      reach_forward: { x: 180, y: 0, z: 50 },
      reach_up: { x: 120, y: 0, z: 160 },
      reach_side: { x: 80, y: (armName === 'left_arm' ? -150 : 150), z: 100 },
    };

    if (presets[preset]) {
      setTarget(presets[preset]);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">
        {armName === 'left_arm' ? '🤖 Left Arm IK Control' : '🤖 Right Arm IK Control'}
      </h3>

      {/* Target Position Input */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            X Position: {target.x.toFixed(1)} mm
          </label>
          <input
            type="range"
            min="0"
            max="250"
            step="5"
            value={target.x}
            onChange={(e) => handleTargetChange('x', Number(e.target.value))}
            disabled={isExecuting}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Y Position: {target.y.toFixed(1)} mm
          </label>
          <input
            type="range"
            min={armName === 'left_arm' ? -200 : 0}
            max={armName === 'left_arm' ? 0 : 200}
            step="5"
            value={target.y}
            onChange={(e) => handleTargetChange('y', Number(e.target.value))}
            disabled={isExecuting}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Z Position: {target.z.toFixed(1)} mm
          </label>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={target.z}
            onChange={(e) => handleTargetChange('z', Number(e.target.value))}
            disabled={isExecuting}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
        </div>
      </div>

      {/* Position Display */}
      <div className="bg-gray-700 rounded p-3 mb-6 text-sm font-mono text-gray-300">
        <div>Target: ({target.x.toFixed(0)}, {target.y.toFixed(0)}, {target.z.toFixed(0)}) mm</div>
        <div className="text-xs text-gray-500 mt-1">Cartesian coordinates</div>
      </div>

      {/* IK Solution Status */}
      {solution && (
        <div className={`rounded p-4 mb-6 ${solution.valid ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg ${solution.valid ? 'text-green-400' : 'text-red-400'}`}>
              {solution.valid ? '✓' : '✗'}
            </span>
            <span className={`font-semibold ${solution.valid ? 'text-green-400' : 'text-red-400'}`}>
              {solution.valid ? 'Reachable' : 'Unreachable'}
            </span>
          </div>

          {solution.valid ? (
            <div className="text-sm text-green-300 space-y-1">
              <div>Shoulder: {solution.angles.shoulder.toFixed(1)}°</div>
              <div>Elbow: {solution.angles.elbow.toFixed(1)}°</div>
              {solution.angles.wrist && <div>Wrist: {solution.angles.wrist.toFixed(1)}°</div>}
            </div>
          ) : (
            <div className="text-sm text-red-300">{solution.error}</div>
          )}
        </div>
      )}

      {/* Presets */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => handlePreset('home')}
          disabled={isExecuting}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors disabled:opacity-50"
        >
          🏠 Home
        </button>
        <button
          onClick={() => handlePreset('reach_forward')}
          disabled={isExecuting}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors disabled:opacity-50"
        >
          → Forward
        </button>
        <button
          onClick={() => handlePreset('reach_up')}
          disabled={isExecuting}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors disabled:opacity-50"
        >
          ↑ Reach Up
        </button>
        <button
          onClick={() => handlePreset('reach_side')}
          disabled={isExecuting}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors disabled:opacity-50"
        >
          ↔ Side Reach
        </button>
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={!solution?.valid || isExecuting}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded font-semibold transition-colors"
      >
        {isExecuting ? '⏳ Executing...' : '▶ Execute IK Solution'}
      </button>

      <p className="text-xs text-gray-500 mt-3">
        Drag sliders to set target position. System calculates joint angles automatically.
      </p>
    </div>
  );
};

export default IKControlPanel;
