import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './shared/Sidebar';
import DashboardPage from '../pages/DashboardPage';
import CameraPage from '../pages/CameraPage';
import ServoPage from '../pages/ServoPage';
import ManualServoControlPage from '../pages/ManualServoControlPage';
import Visualization3DPage from '../pages/Visualization3DPage';
import RosMonitorPage from '../pages/RosMonitorPage';
import SettingsPage from '../pages/SettingsPage';
import ControlModePage from '../pages/ControlModePage';
import Startup3DIntro from './shared/Startup3DIntro';
import StatusBanner from './shared/StatusBanner';
import { useAppStore } from '../store/appStore';
import { ServoCommand, ROS2Topic, ROSState, RobotMode } from '../types';
import { ROSService } from '../services/ros.service';
import { ModeService } from '../services/modeService';
import { ModelService } from '../services/model.service';

const App: React.FC = () => {
  const { config, updateConfig, saveConfig, loadConfig, currentMode } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [cameraConnected, setCameraConnected] = useState(true);
  const [joints, setJoints] = useState<Record<number, number>>({});
  const [jointStatesByName, setJointStatesByName] = useState<Record<string, number>>({});
  const [rosState, setRosState] = useState<ROSState>({
    isConnected: false,
    rosUrl: config.rosUrl,
    error: null,
  });
  const [topics, setTopics] = useState<ROS2Topic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showStartupIntro, setShowStartupIntro] = useState<boolean>(true);
  const [aiNodeActive, setAiNodeActive] = useState<boolean>(false);
  const lastAiHeartbeat = useRef<number>(0);

  const rosServiceRef = useRef<ROSService | null>(null);
  const modeServiceRef = useRef<ModeService | null>(null);
  const lastRosConnectedRef = useRef<boolean>(false);
  const [dismissedRosBannerAt, setDismissedRosBannerAt] = useState<number>(0);
  const [isConnectionCenterOpen, setIsConnectionCenterOpen] = useState(false);

  const connectROS = useCallback(async () => {
    try {
      setRosState(prev => ({
        ...prev,
        rosUrl: config.rosUrl,
        error: null,
      }));

      if (rosServiceRef.current) {
        rosServiceRef.current.disconnect();
        rosServiceRef.current = null;
      }

      const service = new ROSService(config.rosUrl);
      rosServiceRef.current = service;
      await service.connect();

      setRosState({
        isConnected: true,
        rosUrl: config.rosUrl,
        error: null,
      });

      // Subscribe to joint states (servo IDs + full URDF joint names)
      service.subscribeToJointStatesFull((servoJoints, namedJoints) => {
        setJoints(servoJoints);
        setJointStatesByName(namedJoints);
      });

      // Load topics
      setIsLoadingTopics(true);
      const topicList = await service.getTopics();
      setTopics(topicList);

      // Subscribe to AI Heartbeat
      service.subscribe('/axel/heartbeat', 'std_msgs/String', (msg: any) => {
        lastAiHeartbeat.current = Date.now();
        setAiNodeActive(true);
      });

      setIsLoadingTopics(false);
    } catch (error) {
      setRosState({
        isConnected: false,
        rosUrl: config.rosUrl,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      setIsLoadingTopics(false);
      throw error;
    }
  }, [config.rosUrl]);

  const handleReconnectROS = useCallback(async () => {
    if (isReconnecting) return;
    setIsReconnecting(true);
    try {
      await connectROS();
    } catch {
      // Error already reflected in rosState.
    } finally {
      setIsReconnecting(false);
    }
  }, [connectROS, isReconnecting]);

  // Initialize ROS connection and Preload 3D Model once on app start.
  useEffect(() => {
    // Start preloading the heavy 3D assets immediately
    ModelService.getInstance().preloadModel().catch(err => {
      console.error('Initial model preload failed:', err);
    });

    const timer = setTimeout(() => {
      handleReconnectROS();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (rosServiceRef.current) {
        rosServiceRef.current.disconnect();
        rosServiceRef.current = null;
      }
    };
    // Run only once on mount to avoid reconnect/disconnect loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep UI connection state synchronized with underlying ROS service status.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const connected = !!rosServiceRef.current?.isConnected();
      const prev = lastRosConnectedRef.current;
      if (prev !== connected) {
        lastRosConnectedRef.current = connected;
      }
      setRosState(prev => (prev.isConnected === connected ? prev : { ...prev, isConnected: connected }));
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  // Monitor AI Heartbeat timeout
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() - lastAiHeartbeat.current > 5000) {
        setAiNodeActive(false);
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const handleServoCommand = (command: ServoCommand) => {
    if (rosServiceRef.current?.isConnected()) {
      rosServiceRef.current.publishServoCommand(command);
    }
  };

  const handleEmergencyStop = (active: boolean) => {
    if (rosServiceRef.current?.isConnected()) {
      rosServiceRef.current.publishEmergencyStop(active);
    }
  };

  const handleModeChange = async (mode: RobotMode): Promise<boolean> => {
    try {
      // Try to publish to robot if connected
      if (rosServiceRef.current?.isConnected()) {
        // Initialize mode service if needed
        if (!modeServiceRef.current && rosServiceRef.current) {
          modeServiceRef.current = new ModeService(rosServiceRef.current);
        }

        if (modeServiceRef.current) {
          const success = await modeServiceRef.current.publishModeCommand(mode);
          return success;
        }
      }
      return false;
    } catch (error) {
      console.error('Error changing mode:', error);
      return false;
    }
  };

  const handleCameraUrlChange = (url: string) => {
    updateConfig({ ...config, cameraUrl: url });
    setCameraConnected(true);
  };

  const handleIntroComplete = () => {
    setShowStartupIntro(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <DashboardPage
            rosState={rosState}
            cameraConnected={cameraConnected}
            onEmergencyStop={handleEmergencyStop}
            onReconnectROS={handleReconnectROS}
            isReconnecting={isReconnecting}
            onModeChange={handleModeChange}
          />
        );
      case 2:
        return (
          <CameraPage
            cameraUrl={config.cameraUrl}
            onUrlChange={handleCameraUrlChange}
          />
        );
      case 3:
        return <ServoPage onServoCommand={handleServoCommand} />;
      case 6:
        return (
          <Visualization3DPage
            joints={joints}
            jointStatesByName={jointStatesByName}
            rosService={rosServiceRef.current}
            onReconnectROS={handleReconnectROS}
            isReconnecting={isReconnecting}
            onModeChange={handleModeChange}
          />
        );
      case 7:
        return <ManualServoControlPage joints={joints} rosService={rosServiceRef.current} />;
      case 4:
        return <RosMonitorPage topics={topics} isLoading={isLoadingTopics} />;
      case 5:
        return (
          <SettingsPage
            config={config}
            onConfigChange={updateConfig}
            onSave={saveConfig}
            onLoad={loadConfig}
            rosState={rosState}
            rosService={rosServiceRef.current}
            currentMode={currentMode}
            aiNodeActive={aiNodeActive}
            onReconnectROS={handleReconnectROS}
            isReconnecting={isReconnecting}
          />
        );
      case 8:
        return (
          <ControlModePage
            onModeChange={handleModeChange}
            isConnected={rosState.isConnected}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--axel-bg)', color: 'var(--axel-text)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        rosConnected={rosState.isConnected}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Status Bar */}
        <div className="h-12 axel-surface border-b border-slate-700/70 px-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${rosState.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
            />
            <span className="axel-muted">ROS:</span>
            <span className={rosState.isConnected ? 'text-green-400' : 'text-red-400'}>
              {rosState.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${cameraConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
            />
            <span className="axel-muted">Camera:</span>
            <span className={cameraConnected ? 'text-green-400' : 'text-red-400'}>
              {cameraConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${aiNodeActive ? 'bg-green-500' : 'bg-gray-500'
                }`}
            />
            <span className="axel-muted">AI Node:</span>
            <span className={aiNodeActive ? 'text-green-400' : 'text-gray-400'}>
              {aiNodeActive ? 'Active' : 'Standby'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                className="axel-button-secondary px-3 py-1.5 rounded-xl text-xs font-bold"
                onClick={() => setIsConnectionCenterOpen((v) => !v)}
                title="Connection Center"
              >
                Status
              </button>
              {isConnectionCenterOpen && (
                <div className="absolute right-0 mt-2 w-[340px] rounded-2xl border border-slate-700/60 bg-slate-950/80 backdrop-blur p-3 shadow-2xl z-[120]">
                  <p className="text-xs font-bold text-slate-200 mb-2">Connection Center</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="axel-muted">ROS</span>
                      <span className={rosState.isConnected ? 'text-emerald-300' : 'text-rose-300'}>
                        {rosState.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="axel-muted">ROS URL</span>
                      <span className="text-slate-200 font-mono text-[11px] truncate max-w-[220px]">{rosState.rosUrl}</span>
                    </div>
                    {rosState.error && (
                      <div className="mt-2 rounded-xl border border-rose-500/20 bg-rose-950/40 p-2">
                        <p className="text-rose-200 text-[11px] break-words">{rosState.error}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="axel-muted">Camera</span>
                      <span className={cameraConnected ? 'text-emerald-300' : 'text-rose-300'}>
                        {cameraConnected ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="axel-muted">AI Node</span>
                      <span className={aiNodeActive ? 'text-emerald-300' : 'text-slate-300'}>
                        {aiNodeActive ? 'Active' : 'Standby'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    {currentPage !== 5 && (
                      <button
                        className="axel-button-secondary px-3 py-2 rounded-xl text-xs font-bold"
                        onClick={() => {
                          setIsConnectionCenterOpen(false);
                          setCurrentPage(5);
                        }}
                      >
                        Open Settings
                      </button>
                    )}
                    <button
                      className="axel-button-primary px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                      onClick={() => {
                        setIsConnectionCenterOpen(false);
                        handleReconnectROS();
                      }}
                      disabled={isReconnecting}
                    >
                      {isReconnecting ? 'Reconnecting…' : 'Reconnect ROS'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span className="axel-accent font-semibold">{config.robotName}</span>
          </div>
        </div>

        {!showStartupIntro && !rosState.isConnected && Date.now() - dismissedRosBannerAt > 15000 && (
          <StatusBanner
            tone="error"
            placement="floating-left"
            title="ROS disconnected"
            description={rosState.error ? rosState.error : 'No connection to rosbridge server. Check URL and network.'}
            actions={[
              {
                label: isReconnecting ? 'Reconnecting…' : 'Reconnect',
                onClick: handleReconnectROS,
                variant: 'primary',
                disabled: isReconnecting,
              },
              ...(currentPage !== 5
                ? [
                    {
                      label: 'Open Settings',
                      onClick: () => setCurrentPage(5),
                      variant: 'secondary' as const,
                    },
                  ]
                : []),
            ]}
            onDismiss={() => setDismissedRosBannerAt(Date.now())}
          />
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
      </div>

      {showStartupIntro && <Startup3DIntro onComplete={handleIntroComplete} />}
    </div>
  );
};

export default App;
