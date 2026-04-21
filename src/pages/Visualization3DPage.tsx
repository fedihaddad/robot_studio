import React, { useState, useMemo, useCallback } from 'react';
import RobotViewer from '../components/shared/RobotViewer';
import EnhancedVisualization from '../components/3d-visualization/EnhancedVisualization';
import ServoSlider from '../components/shared/ServoSlider';
import ModeCard from '../components/shared/ModeCard';
import { useServoControl } from '../hooks/useServoControl';
import { useAppStore } from '../store/appStore';
import { ServoCommand, RobotMode } from '../types';
import { ROSService } from '../services/ros.service';
import { getServoConfig } from '../config/servoDegrees.config';
import { servoJointMapping } from '../config/complete-joints.config';

interface Visualization3DPageProps {
  joints?: Record<number, number>;
  jointStatesByName?: Record<string, number>;
  onServoCommand?: (command: ServoCommand) => void;
  rosService: ROSService | null;
  onReconnectROS?: () => void;
  isReconnecting?: boolean;
  onModeChange?: (mode: RobotMode) => Promise<boolean>;
}

const Visualization3DPage: React.FC<Visualization3DPageProps> = ({
  joints = {},
  jointStatesByName = {},
  onServoCommand,
  rosService,
  onReconnectROS,
  isReconnecting = false,
  onModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'head' | 'arm' | 'mode'>('head');
  const [useEnhancedVisualization, setUseEnhancedVisualization] = useState(true);
  const [showCollisions, setShowCollisions] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showTF, setShowTF] = useState(false);
  const [reconnectAttempted, setReconnectAttempted] = useState(false);
  const [reconnectToast, setReconnectToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [currentSliderValues, setCurrentSliderValues] = useState<Record<number, number>>({});
  const [initialSliderValues, setInitialSliderValues] = useState<Record<number, number> | null>(null);
  const {
    jointStates: offlineJointStates,
    updateJointState,
    resetJointStates,
  } = useAppStore();

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

  const handleReconnectClick = () => {
    setReconnectAttempted(true);
    onReconnectROS?.();
  };

  React.useEffect(() => {
    if (!reconnectAttempted || isReconnecting) return;

    if (isConnected) {
      setReconnectToast({
        type: 'success',
        message: 'ROS reconnected successfully.',
      });
    } else {
      setReconnectToast({
        type: 'error',
        message: 'Reconnect failed. Check rosbridge and network.',
      });
    }

    const timer = window.setTimeout(() => {
      setReconnectToast(null);
      setReconnectAttempted(false);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [reconnectAttempted, isReconnecting, isConnected]);

  // Capture initial slider values on first mount (only once)
  React.useEffect(() => {
    if (initialSliderValues === null && (activeTab === 'head' || activeTab === 'arm')) {
      const headServoIds = getHeadServoIds();
      const armServoIds = getArmServoIds();
      const allServoIds = [...headServoIds, ...armServoIds];

      const initialValues: Record<number, number> = {};
      allServoIds.forEach((servoId) => {
        const config = getServoConfig(servoId);
        // Use config defaults as initial values
        initialValues[servoId] = config.default;
      });

      setInitialSliderValues(initialValues);
      setCurrentSliderValues(initialValues);

      console.log('═══════════════════════════════════════════════');
      console.log('✅ INITIAL SLIDER POSITIONS CAPTURED');
      console.log('═══════════════════════════════════════════════');
      console.log('Number of servos:', Object.keys(initialValues).length);
      console.log('Initial positions:', initialValues);
      console.log('═══════════════════════════════════════════════');
    }
  }, []);

  const handleServoChange = (id: number, angle: number) => {
    const config = getServoConfig(id);
    const servoName = config.name || `Servo ${id}`;
    const command: ServoCommand = { id, angle };

    // Track current slider value
    setCurrentSliderValues(prev => ({
      ...prev,
      [id]: angle,
    }));

    if (isConnected) {
      // Online mode: send to ROS
      console.log(`
  🟢 [ONLINE → ROS] Servo ${id} (${servoName}) set to ${angle.toFixed(1)}°`);
      sendCommand(command);
      onServoCommand?.(command);
    } else {
      // Offline mode: update local joint state for visualization
      const jointName = SERVO_ID_TO_JOINT_NAME[id];
      if (jointName) {
        // Map hardware angle to URDF angle (0 rad = default pose)
        const urdfAngle = angle - config.default;
        const radians = (urdfAngle * Math.PI) / 180;
        updateJointState(jointName, radians);
        console.log(`  📺 [OFFLINE] Servo ${id} (${servoName}) LOCAL update → ${angle.toFixed(1)}° (URDF offset: ${urdfAngle.toFixed(1)}°, ${radians.toFixed(4)} rad)`);
      } else {
        console.warn(`  ❌ Joint mapping not found for Servo ${id}`);
      }
    }
  };

  // Reset all servos to initial position
  const handleResetRobot = () => {
    if (!initialSliderValues || Object.keys(initialSliderValues).length === 0) {
      console.warn('⚠️ Initial slider positions not yet captured. Page may still be loading.');
      return;
    }

    console.log('╔════════════════════════════════════════════╗');
    console.log('║  🔄 RESETTING TO INITIAL POSITION         ║');
    console.log('╚════════════════════════════════════════════╝');

    // Iterate through initial slider values and reset each one
    Object.entries(initialSliderValues).forEach(([servoIdStr, initialAngle]) => {
      const servoId = parseInt(servoIdStr, 10);
      if (isNaN(servoId) || initialAngle === undefined || initialAngle === null) {
        return; // Skip invalid entries
      }

      const config = getServoConfig(servoId);
      console.log(`  ✓ Servo ${String(servoId).padStart(2)}: ${config.name.padEnd(30)} → ${String(initialAngle.toFixed(1) + '°').padStart(8)}`);

      // Reset slider to initial value
      handleServoChange(servoId, initialAngle);
    });

    console.log('╔════════════════════════════════════════════╗');
    console.log('║  ✅ RESET TO INITIAL POSITION COMPLETE    ║');
    console.log('╚════════════════════════════════════════════╝');
  };

  // Wrap for RobotViewer which needs (command: ServoCommand) signature
  const handleRobotViewerCommand = (command: ServoCommand) => {
    handleServoChange(command.id, command.angle);
  };

  const headServoIds = getHeadServoIds();
  const armServoIds = getArmServoIds();

  // Create reverse mapping: servo ID -> joint name
  const SERVO_ID_TO_JOINT_NAME = servoJointMapping;

  // Convert servo states (ID-based) to joint states (name-based)
  const convertedServoStates = useMemo(() => {
    const converted: Record<string, number> = {};
    Object.entries(servoStates).forEach(([servoIdStr, state]) => {
      const servoId = parseInt(servoIdStr, 10);
      const jointName = SERVO_ID_TO_JOINT_NAME[servoId];
      if (jointName && typeof state.angle === 'number') {
        const config = getServoConfig(servoId);
        // Convert degrees to radians for URDF, applying the default offset
        converted[jointName] = ((state.angle - config.default) * Math.PI) / 180;
      }
    });
    return converted;
  }, [servoStates, SERVO_ID_TO_JOINT_NAME]);

  // Handle direct 3D interactive dragging
  const handleJointDrag = useCallback((jointName: string, deltaAngle: number) => {
    // Find servo ID from joint name
    const servoIdStr = Object.keys(SERVO_ID_TO_JOINT_NAME).find(
      key => SERVO_ID_TO_JOINT_NAME[parseInt(key)] === jointName
    );
    if (!servoIdStr) return;

    const servoId = parseInt(servoIdStr, 10);
    const config = getServoConfig(servoId);

    setCurrentSliderValues(prev => {
      const current = isConnected
        ? (servoStates[servoId]?.angle ?? config.default)
        : (prev[servoId] ?? config.default);

      const newAngle = Math.max(config.min, Math.min(config.max, current + deltaAngle));

      // Update actual state outside of the render cycle
      setTimeout(() => handleServoChange(servoId, newAngle), 0);

      return {
        ...prev,
        [servoId]: newAngle
      };
    });
  }, [isConnected, servoStates, handleServoChange]);

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
    <div className="p-6 h-full flex flex-col gap-6 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#0a1128] text-white">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 drop-shadow-md tracking-tight">
            3D Robot Visualization
          </h1>
          <p className="text-slate-400 font-medium">Real-time visualization and control with interactive MoveIt features</p>
        </div>
        <div className="flex gap-2 items-center">
          <div
            className={`px-5 py-2.5 rounded-xl font-bold tracking-wide text-sm shadow-lg backdrop-blur-md border ${isConnected
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}
          >
            {isConnected ? '🟢 Connected to ROS' : '📺 Offline Mode'}
          </div>
          {!isConnected && (
            <button
              onClick={handleReconnectClick}
              disabled={!onReconnectROS || isReconnecting}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${isReconnecting
                  ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border border-cyan-400/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                }`}
            >
              {isReconnecting ? 'Reconnecting...' : 'Reconnect ROS'}
            </button>
          )}
          <label className="flex items-center gap-2 bg-slate-800/60 border border-white/5 backdrop-blur-md px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-700/60 transition-colors shadow-lg">
            <input
              type="checkbox"
              checked={useEnhancedVisualization}
              onChange={(e) => setUseEnhancedVisualization(e.target.checked)}
              className="rounded text-cyan-500 focus:ring-cyan-500/50 bg-slate-900 border-slate-700 cursor-pointer"
            />
            <span className="text-sm font-semibold text-slate-200">Premium View</span>
          </label>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/40 border border-blue-500/30 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
          <p className="text-blue-100 font-medium">
            <strong className="text-blue-300">Offline Mode Active:</strong> Control the robot dynamically in simulation by clicking and dragging parts or using sliders!
          </p>
        </div>
      )}

      {reconnectToast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg border shadow-lg ${reconnectToast.type === 'success'
              ? 'bg-green-900 border-green-700 text-green-200'
              : 'bg-red-900 border-red-700 text-red-200'
            }`}
        >
          <p className="text-sm font-semibold">{reconnectToast.message}</p>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 min-w-0 h-full relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,180,255,0.1)] border border-cyan-500/20 bg-slate-900/50 backdrop-blur-md">
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
              onJointDrag={handleJointDrag}
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

        <div className="w-[380px] flex flex-col rounded-2xl bg-[#1e293b]/60 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-b border-white/5 p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-bold text-white tracking-tight">Live Control</h2>
              <div className="flex gap-3 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div> {new Date(lastUpdate).toLocaleTimeString()}</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {Object.keys(servoStates).length} Servos</span>
              </div>
            </div>

            <button
              onClick={handleResetRobot}
              className="w-full px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold rounded-lg transition-all shadow-md text-xs flex items-center justify-center gap-2 tracking-wide"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Reset All Servos
            </button>

            {useEnhancedVisualization && (
              <div className="mt-3 border-t border-white/5 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-white/5 hover:border-white/20 uppercase tracking-tighter">
                    <input
                      type="checkbox"
                      checked={showCollisions}
                      onChange={(e) => setShowCollisions(e.target.checked)}
                      className="w-3 h-3 rounded text-cyan-500 focus:ring-cyan-500/50 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    Collisions
                  </label>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-white/5 hover:border-white/20 uppercase tracking-tighter">
                    <input
                      type="checkbox"
                      checked={showMarkers}
                      onChange={(e) => setShowMarkers(e.target.checked)}
                      className="w-3 h-3 rounded text-cyan-500 focus:ring-cyan-500/50 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    Markers
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 p-3 bg-slate-900/50 border-b border-white/5">
            <button
              onClick={() => setActiveTab('head')}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all text-xs tracking-wider ${activeTab === 'head'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              HEAD ({headServoIds.length})
            </button>
            <button
              onClick={() => setActiveTab('arm')}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all text-xs tracking-wider ${activeTab === 'arm'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              ARM ({armServoIds.length})
            </button>
            <button
              onClick={() => setActiveTab('mode')}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all text-xs tracking-wider ${activeTab === 'mode'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              MODE 🎯
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'mode' ? (
              <div className="h-full">
                <ModeCard
                  onModeChange={onModeChange}
                  isConnected={isConnected}
                />
              </div>
            ) : activeTab === 'head' ? (
              <div className="space-y-3">
                {headServoIds.map((servoId) => {
                  const config = getServoConfig(servoId);
                  const currentAngle = isConnected
                    ? (servoStates[servoId]?.angle ?? config.default)
                    : (currentSliderValues[servoId] ?? config.default);

                  return (
                    <div key={servoId} className="group bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-transparent hover:border-cyan-500/30">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                          {config.name} <span className="text-slate-500 ml-1">#{servoId}</span>
                        </label>
                        <div className="px-2 py-1 bg-black/40 rounded-lg text-xs text-cyan-300 font-mono shadow-inner border border-white/5">
                          {currentAngle.toFixed(1)}°
                        </div>
                      </div>
                      <ServoSlider
                        id={servoId}
                        label=""
                        value={currentAngle}
                        min={config.min}
                        max={config.max}
                        onChange={(value) => handleServoChange(servoId, value)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {armServoIds.map((servoId) => {
                  const config = getServoConfig(servoId);
                  const currentAngle = isConnected
                    ? (servoStates[servoId]?.angle ?? config.default)
                    : (currentSliderValues[servoId] ?? config.default);

                  return (
                    <div key={servoId} className="group bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-transparent hover:border-cyan-500/30">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                          {config.name} <span className="text-slate-500 ml-1">#{servoId}</span>
                        </label>
                        <div className="px-2 py-1 bg-black/40 rounded-lg text-xs text-cyan-300 font-mono shadow-inner border border-white/5">
                          {currentAngle.toFixed(1)}°
                        </div>
                      </div>
                      <ServoSlider
                        id={servoId}
                        label=""
                        value={currentAngle}
                        min={config.min}
                        max={config.max}
                        onChange={(value) => handleServoChange(servoId, value)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Visualization3DPage;
