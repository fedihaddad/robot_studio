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
import { useAppStore } from '../store/appStore';
import { ServoCommand, ROS2Topic, ROSState, RobotMode } from '../types';
import { ROSService } from '../services/ros.service';
import { ModeService } from '../services/modeService';
import { ModelService } from '../services/model.service';

const App: React.FC = () => {
  const { config, updateConfig, saveConfig, loadConfig, currentMode } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('axel_theme') : null;
    return saved === 'light' ? 'light' : 'dark';
  });
  const [cameraConnected, setCameraConnected] = useState(false);
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
  /** `undefined` = not driven by a ROS state topic; when set, mirrors `std_msgs/Bool` feedback. */
  const [emergencyStopRemote, setEmergencyStopRemote] = useState<boolean | undefined>(undefined);
  const emergencyStopUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    window.localStorage.setItem('axel_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

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

      emergencyStopUnsubRef.current?.();
      emergencyStopUnsubRef.current = null;
      setEmergencyStopRemote(undefined);
      const esUnsub = service.subscribeToEmergencyStopState((active) => {
        setEmergencyStopRemote(active);
      });
      if (esUnsub) {
        emergencyStopUnsubRef.current = esUnsub;
      }

      setIsLoadingTopics(false);
    } catch (error) {
      emergencyStopUnsubRef.current = null;
      setEmergencyStopRemote(undefined);
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

  useEffect(() => {
    if (!rosState.isConnected) {
      setEmergencyStopRemote(undefined);
    }
  }, [rosState.isConnected]);

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
            emergencyStopRemote={emergencyStopRemote}
            currentMode={currentMode}
          />
        );
      case 2:
        return (
          <CameraPage
            cameraUrl={config.cameraUrl}
            onConnectionChange={setCameraConnected}
            rosService={rosServiceRef.current}
            rosConnected={rosState.isConnected}
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
            theme={theme}
            onToggleTheme={toggleTheme}
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
        cameraConnected={cameraConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
        onReconnectROS={handleReconnectROS}
        isReconnecting={isReconnecting}
        config={config}
        onConfigChange={updateConfig}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Intentionally removed the floating ROS disconnected toast/banner. */}

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
