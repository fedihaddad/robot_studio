import React, { useState, useMemo } from 'react';
import RobotViewer from '../components/shared/RobotViewer';
import EnhancedVisualization from '../components/3d-visualization/EnhancedVisualization';
import ServoSlider from '../components/shared/ServoSlider';
import { useServoControl } from '../hooks/useServoControl';
import { useAppStore } from '../store/appStore';
import { ServoCommand } from '../types';
import { ROSService, JOINT_NAME_TO_SERVO_ID } from '../services/ros.service';
import { getServoConfig } from '../config/servoDegrees.config';

interface Visualization3DPageProps {
  joints?: Record<number, number>;
  jointStatesByName?: Record<string, number>;
  onServoCommand?: (command: ServoCommand) => void;
  rosService: ROSService | null;
}

const Visualization3DPage: React.FC<Visualization3DPageProps> = ({
  joints = {},
  jointStatesByName = {},
  onServoCommand,
  rosService,
}) => {
  const [activeTab, setActiveTab] = useState<'head' | 'arm'>('head');
  const [useEnhancedVisualization, setUseEnhancedVisualization] = useState(true);
  const [showCollisions, setShowCollisions] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showTF, setShowTF] = useState(false);
  const { jointStates: offlineJointStates } = useAppStore();

  const {
    servoStates,
    isConnected: servoHookConnected,
    lastUpdate,
    sendCommand,
    getHeadServoIds,
    getArmServoIds,
  } = useServoControl({
    rosService,
    enabled: true,
  });
  const isConnected = rosService?.isConnected() ?? servoHookConnected;

  const handleServoChange = (id: number, angle: number) => {
    const command: ServoCommand = { id, angle };
    sendCommand(command);
    onServoCommand?.(command);
  };

  // Wrap for RobotViewer which needs (command: ServoCommand) signature
  const handleRobotViewerCommand = (command: ServoCommand) => {
    handleServoChange(command.id, command.angle);
  };

  const headServoIds = getHeadServoIds();
  const armServoIds = getArmServoIds();
  const armServoIdsWithoutLeftWrist = armServoIds.filter((id) => id !== 16);

  // Create reverse mapping: servo ID -> joint name
  const SERVO_ID_TO_JOINT_NAME = useMemo(() => {
    const reverse: Record<number, string> = {};
    Object.entries(JOINT_NAME_TO_SERVO_ID).forEach(([jointName, servoId]) => {
      reverse[servoId] = jointName;
    });
    return reverse;
  }, []);

  // Convert servo states (ID-based) to joint states (name-based)
  const convertedServoStates = useMemo(() => {
    const converted: Record<string, number> = {};
    Object.entries(servoStates).forEach(([servoIdStr, state]) => {
      const servoId = parseInt(servoIdStr, 10);
      const jointName = SERVO_ID_TO_JOINT_NAME[servoId];
      if (jointName && typeof state.angle === 'number') {
        // Convert degrees to radians for URDF
        converted[jointName] = (state.angle * Math.PI) / 180;
      }
    });
    return converted;
  }, [servoStates, SERVO_ID_TO_JOINT_NAME]);

  // Merge offline and ROS joint states
  const mergedJointStates = useMemo(() => {
    const offlineOverrides = !isConnected ? offlineJointStates : {};

    return {
      ...convertedServoStates,
      ...jointStatesByName,
      ...offlineOverrides, // Only override with offline states when ROS is disconnected
    };
  }, [convertedServoStates, jointStatesByName, offlineJointStates, isConnected]);

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">3D Robot Visualization</h1>
          <p className="text-gray-400">Real-time visualization and control with MoveIt features</p>
        </div>
        <div className="flex gap-2 items-center">
          <div
            className={`px-4 py-2 rounded-lg font-semibold ${
              isConnected ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'
            }`}
          >
            {isConnected ? '🟢 Connected to ROS' : '📺 Offline Mode'}
          </div>
          <label className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded cursor-pointer hover:bg-gray-600">
            <input
              type="checkbox"
              checked={useEnhancedVisualization}
              onChange={(e) => setUseEnhancedVisualization(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-200">Enhanced View</span>
          </label>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-200">
            💻 Offline Mode Active - Control the robot in simulation without ROS2 connection!
          </p>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 min-w-0 h-full">
          {useEnhancedVisualization ? (
            <EnhancedVisualization
              joints={{}}
              jointStatesByName={mergedJointStates}
              isConnected={isConnected}
              rosService={rosService}
              showCollisions={showCollisions}
              showMarkers={showMarkers}
              showTF={showTF}
              showTrajectoryControls={true}
            />
          ) : (
            <RobotViewer
              joints={{}}
              jointStatesByName={mergedJointStates}
              isConnected={isConnected}
              onServoCommand={handleRobotViewerCommand}
            />
          )}
        </div>

        <div className="w-96 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
          <div className="bg-gray-750 border-b border-gray-700 p-4">
            <h2 className="text-lg font-bold text-white mb-3">Live Control</h2>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Last update: {new Date(lastUpdate).toLocaleTimeString()}</p>
              <p>Connected servos: {Object.keys(servoStates).length}</p>
            </div>

            {useEnhancedVisualization && (
              <div className="mt-4 border-t border-gray-700 pt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-300">Visualization Layers</p>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showCollisions}
                    onChange={(e) => setShowCollisions(e.target.checked)}
                    className="rounded"
                  />
                  Collision Meshes
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showMarkers}
                    onChange={(e) => setShowMarkers(e.target.checked)}
                    className="rounded"
                  />
                  Scene Objects & Markers
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showTF}
                    onChange={(e) => setShowTF(e.target.checked)}
                    className="rounded"
                  />
                  TF Frames (Advanced)
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2 p-4 border-b border-gray-700 bg-gray-750">
            <button
              onClick={() => setActiveTab('head')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                activeTab === 'head'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Head ({headServoIds.length})
            </button>
            <button
              onClick={() => setActiveTab('arm')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                activeTab === 'arm'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Arm ({armServoIds.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'head' ? (
              <div className="space-y-3">
                {headServoIds.map((servoId) => {
                  const config = getServoConfig(servoId);
                  const currentAngle = servoStates[servoId]?.angle || config.default;

                  return (
                    <div key={servoId}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-300">Servo {servoId}</label>
                        <span className="text-xs text-blue-400 font-semibold">
                          {currentAngle.toFixed(1)}°
                        </span>
                      </div>
                      <ServoSlider
                        id={servoId}
                        label=""
                        value={currentAngle}
                        min={config.min}
                        max={config.max}
                        onChange={(value) => handleServoChange(servoId, value)}
                        disabled={!isConnected}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-700/40 border border-gray-600 rounded-lg p-3 mb-2">
                  <p className="text-xs font-semibold text-gray-200 mb-2">Hand Rotation</p>

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-300">Right Wrist (Servo 11)</label>
                      <span className="text-xs text-blue-400 font-semibold">
                        {(servoStates[11]?.angle ?? 0).toFixed(1)}°
                      </span>
                    </div>
                    <ServoSlider
                      id={11}
                      label=""
                      value={servoStates[11]?.angle ?? 0}
                      min={-180}
                      max={180}
                      onChange={(value) => handleServoChange(11, value)}
                      disabled={!isConnected}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-300">Left Wrist (Servo 16)</label>
                      <span className="text-xs text-blue-400 font-semibold">
                        {(servoStates[16]?.angle ?? 0).toFixed(1)}°
                      </span>
                    </div>
                    <ServoSlider
                      id={16}
                      label=""
                      value={servoStates[16]?.angle ?? 0}
                      min={-180}
                      max={180}
                      onChange={(value) => handleServoChange(16, value)}
                      disabled={!isConnected}
                    />
                  </div>
                </div>

                {armServoIdsWithoutLeftWrist.map((servoId) => {
                  const config = getServoConfig(servoId);
                  const currentAngle = servoStates[servoId]?.angle || config.default;

                  return (
                    <div key={servoId}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-300">Servo {servoId}</label>
                        <span className="text-xs text-blue-400 font-semibold">
                          {currentAngle.toFixed(1)}°
                        </span>
                      </div>
                      <ServoSlider
                        id={servoId}
                        label=""
                        value={currentAngle}
                        min={config.min}
                        max={config.max}
                        onChange={(value) => handleServoChange(servoId, value)}
                        disabled={!isConnected}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 p-4 bg-gray-750 text-xs text-gray-400">
            <p className="mb-2 font-semibold text-gray-300">Info</p>
            <ul className="space-y-1">
              <li>URDF model loaded in local viewer</li>
              <li>Real-time updates from /joint_states</li>
              <li>Commands sent to /cmd_servo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualization3DPage;
