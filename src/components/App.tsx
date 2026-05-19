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
import DemoModePage from '../pages/DemoModePage';
import LoginPage from '../pages/LoginPage';
import Startup3DIntro from './shared/Startup3DIntro';

import { useAppStore } from '../store/appStore';

import { ServoCommand, ROS2Topic, ROSState, RobotMode } from '../types';

import { ROSService } from '../services/ros.service';

import { ModeService } from '../services/modeService';

import { ModelService } from '../services/model.service';
import { getRosbridgeCandidates, normalizeRosbridgeUrl } from '../services/ros-endpoint.service';



const App: React.FC = () => {

  const { config, updateConfig, saveConfig, loadConfig, currentMode, language } = useAppStore();
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

    rosUrl: normalizeRosbridgeUrl(config.rosUrl),

    error: null,

    status: 'disconnected',

    resolvedRosUrl: null,

    lastAttemptedRosUrl: normalizeRosbridgeUrl(config.rosUrl),

  });

  const [topics, setTopics] = useState<ROS2Topic[]>([]);

  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const [isReconnecting, setIsReconnecting] = useState(false);

  const [showStartupIntro, setShowStartupIntro] = useState<boolean>(true);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // If password protection is disabled, auto-authenticate
    const savedConfig = localStorage.getItem('axelConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return !parsed.passwordEnabled;
    }
    return true; // Default no password
  });

  const [aiNodeActive, setAiNodeActive] = useState<boolean>(false);

  const lastAiHeartbeat = useRef<number>(0);



  const rosServiceRef = useRef<ROSService | null>(null);

  const modeServiceRef = useRef<ModeService | null>(null);

  const lastRosConnectedRef = useRef<boolean>(false);
  const connectRosFnRef = useRef<(() => Promise<void>) | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  /** `undefined` = not driven by a ROS state topic; when set, mirrors `std_msgs/Bool` feedback. */

  const [emergencyStopRemote, setEmergencyStopRemote] = useState<boolean | undefined>(undefined);

  const emergencyStopUnsubRef = useRef<(() => void) | null>(null);



  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    window.localStorage.setItem('axel_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);


  const toggleTheme = useCallback(() => {

    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  }, []);

  const scheduleReconnect = useCallback((reason = 'connection retry') => {
    if (!isMountedRef.current) return;
    if (reconnectTimerRef.current !== null) return;

    reconnectAttemptRef.current += 1;
    const delayMs = Math.min(30000, 5000 + reconnectAttemptRef.current * 5000);
    console.debug(`[AXEL Dashboard] Scheduling ROS reconnect in ${delayMs}ms (${reason})`);

    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRosFnRef.current?.().catch(() => {
        // handled inside connectROS
      });
    }, delayMs);
  }, []);


  const connectROS = useCallback(async () => {
    const normalizedConfiguredUrl = normalizeRosbridgeUrl(config.rosUrl);
    const candidates = getRosbridgeCandidates(config.rosUrl);
    const isRetry = reconnectAttemptRef.current > 0;

    try {
      setRosState(prev => ({
        ...prev,
        isConnected: false,
        rosUrl: normalizedConfiguredUrl,
        error: null,
        status: isRetry ? 'reconnecting' : 'connecting',
        resolvedRosUrl: null,
        lastAttemptedRosUrl: candidates[0] ?? normalizedConfiguredUrl,
      }));

      if (rosServiceRef.current) {
        rosServiceRef.current.disconnect();
        rosServiceRef.current = null;
      }

      let service: ROSService | null = null;
      let connectedUrl: string | null = null;
      let lastError: Error | null = null;

      for (const candidate of candidates) {
        setRosState(prev => ({
          ...prev,
          rosUrl: candidate,
          lastAttemptedRosUrl: candidate,
          status: isRetry ? 'reconnecting' : 'connecting',
        }));

        const candidateService = new ROSService(candidate, {
          connectionTimeoutMs: 4000,
          debug: true,
        });

        try {
          await candidateService.connect();
          service = candidateService;
          connectedUrl = candidate;
          break;
        } catch (error) {
          candidateService.disconnect();
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[AXEL Dashboard] ROSBridge candidate failed: ${candidate}`, lastError);
        }
      }

      if (!service || !connectedUrl) {
        throw lastError ?? new Error(`Failed to connect to any ROSBridge endpoint (${candidates.join(', ')})`);
      }

      rosServiceRef.current = service;

      setRosState({
        isConnected: true,
        rosUrl: connectedUrl,
        error: null,
        status: 'connected',
        resolvedRosUrl: connectedUrl,
        lastAttemptedRosUrl: connectedUrl,
      });

      reconnectAttemptRef.current = 0;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      service.subscribeToJointStatesFull((servoJoints, namedJoints) => {
        setJoints(servoJoints);
        setJointStatesByName(namedJoints);
      });

      setIsLoadingTopics(true);
      const topicList = await service.getTopics();
      setTopics(topicList);

      service.subscribe('/axel/heartbeat', 'std_msgs/String', () => {
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
      if (rosServiceRef.current) {
        rosServiceRef.current.disconnect();
        rosServiceRef.current = null;
      }
      emergencyStopUnsubRef.current = null;
      setEmergencyStopRemote(undefined);
      setRosState({
        isConnected: false,
        rosUrl: normalizedConfiguredUrl,
        error: error instanceof Error ? error.message : 'Connection failed',
        status: isRetry ? 'reconnecting' : 'connection_lost',
        resolvedRosUrl: null,
        lastAttemptedRosUrl: candidates[candidates.length - 1] ?? normalizedConfiguredUrl,
      });
      setIsLoadingTopics(false);
      scheduleReconnect('connect failure');
      throw error;
    }

  }, [config.rosUrl, scheduleReconnect]);

  useEffect(() => {
    connectRosFnRef.current = connectROS;
  }, [connectROS]);



  const handleReconnectROS = useCallback(async () => {

    if (isReconnecting) return;

    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

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
    isMountedRef.current = true;

    // Start preloading the heavy 3D assets immediately

    ModelService.getInstance().preloadModel().catch(err => {

      console.error('Initial model preload failed:', err);

    });



    const timer = setTimeout(() => {

      handleReconnectROS();

    }, 1000);



    return () => {
      isMountedRef.current = false;

      clearTimeout(timer);

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (rosServiceRef.current) {

        rosServiceRef.current.disconnect();

        rosServiceRef.current = null;

      }

    };

    // Run only once on mount to avoid reconnect/disconnect loops.
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

        if (prev && !connected) {
          setRosState((state) => ({
            ...state,
            isConnected: false,
            status: 'connection_lost',
            resolvedRosUrl: null,
          }));
          scheduleReconnect('connection lost');
        }

      }

      setRosState(prev => (prev.isConnected === connected ? prev : { ...prev, isConnected: connected }));

    }, 500);



    return () => window.clearInterval(timer);

  }, [scheduleReconnect]);



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
      case 9:
        return (
          <DemoModePage
            rosService={rosServiceRef.current}
            rosConnected={rosState.isConnected}
            onServoCommand={handleServoCommand}
            emergencyStopActive={emergencyStopRemote}
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

      {!isAuthenticated && config.passwordEnabled && (
        <LoginPage onLogin={() => setIsAuthenticated(true)} />
      )}
    </div>

  );

};



export default App;

