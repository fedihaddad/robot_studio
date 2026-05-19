import React, { useState, useMemo, useCallback, useRef } from 'react';
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
import {
  BoltIcon,
  CameraIcon,
  CheckCircleIcon,
  HandRaisedIcon,
  HomeIcon,
  MicrophoneIcon,
  PlayIcon,
  ShieldCheckIcon,
  StopCircleIcon,
  EyeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Visualization3DPageProps {
  joints?: Record<number, number>;
  jointStatesByName?: Record<string, number>;
  rosService: ROSService | null;
  onModeChange?: (mode: RobotMode) => Promise<boolean>;
}

const Visualization3DPage: React.FC<Visualization3DPageProps> = ({
  joints = {},
  jointStatesByName = {},
  rosService,
  onModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'head' | 'arm' | 'mode' | 'demo'>('head');
  const [useEnhancedVisualization, setUseEnhancedVisualization] = useState(true);
  const [showCollisions, setShowCollisions] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showTF, setShowTF] = useState(false);
  const [currentSliderValues, setCurrentSliderValues] = useState<Record<number, number>>({});
  const [initialSliderValues, setInitialSliderValues] = useState<Record<number, number> | null>(null);
  const [previewJointStatesOnline, setPreviewJointStatesOnline] = useState<Record<string, number>>({});
  const {
    jointStates: offlineJointStates,
    updateJointState,
    updateJointStates,
    resetJointStates,
    t,
  } = useAppStore();
  const [gestureRunning, setGestureRunning] = useState(false);
  const [gestureStatus, setGestureStatus] = useState<string>(t('common.ready'));
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Demo mode state (declarations only - functions defined after isConnected)
  type DemoStatus = 'ready' | 'running' | 'done' | 'failed';
  const [demoStatus, setDemoStatus] = useState<DemoStatus>('ready');
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);
  const [demoStepText, setDemoStepText] = useState<string>(t('demo.ready', 'Ready'));
  const demoRunTokenRef = useRef(0);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  // Demo mode functions (must be after isConnected is defined)
  const DEMO_STOPPED_ERROR = 'DEMO_STOPPED';
  const SAFE_POSE: Record<string, number> = {
    r_shoulder_out_joint: 0,
    r_shoulder_lift_joint: 0,
    r_upper_arm_roll_joint: 0,
    r_elbow_flex_joint: 0,
    r_wrist_roll_joint: 0,
    l_shoulder_out_joint: 0,
    l_shoulder_lift_joint: 0,
    l_upper_arm_roll_joint: 0,
    l_elbow_flex_joint: 0,
    l_wrist_roll_joint: 0,
    head_tilt_joint: 0,
    head_pan_joint: 0,
    jaw_joint: 0,
  };

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const assertDemoToken = (token: number) => {
    if (demoRunTokenRef.current !== token) {
      throw new Error(DEMO_STOPPED_ERROR);
    }
  };

  const publishServoForDemo = async (id: number, angle: number, token: number, delay = 250) => {
    assertDemoToken(token);
    // Send to real robot if connected
    if (isConnected) {
      sendCommand({ id, angle });
    }
    // Also update 3D preview
    const jointName = servoJointMapping[id];
    if (jointName) {
      const config = getServoConfig(id);
      const urdfAngle = angle - config.default;
      const radians = (urdfAngle * Math.PI) / 180;
      updateJointState(jointName, radians);
    }
    await sleep(delay);
    assertDemoToken(token);
  };

  const publishRobotCommand = (command: string) => {
    if (isConnected && rosService?.isConnected()) {
      rosService.publish('/robot_command', 'std_msgs/String', { data: command });
      rosService.publish('/robot_function', 'std_msgs/String', { data: command });
    }
  };

  const setDemoPose = async (pose: Record<string, number>, token?: number, delay = 500) => {
    if (typeof token === 'number') assertDemoToken(token);
    updateJointStates(pose);
    await sleep(delay);
    if (typeof token === 'number') assertDemoToken(token);
  };

  const returnToSafePose = async () => {
    publishRobotCommand('home');
    await setDemoPose(SAFE_POSE, undefined, 350);
  };

  const handleStopDemo = async () => {
    if (demoStatus !== 'running') return;
    demoRunTokenRef.current += 1;
    setDemoStepText(t('demo.stopping', 'Stopping...'));
    await returnToSafePose();
    setDemoStatus('ready');
    setActiveDemoId(null);
    setDemoStepText(t('demo.ready', 'Ready'));
  };

  interface DemoAction {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    run: (token: number) => Promise<void>;
  }

  const demos: DemoAction[] = useMemo(() => {
    const raisedPose = {
      r_shoulder_out_joint: -0.10,
      r_shoulder_lift_joint: -1.10,
      r_upper_arm_roll_joint: 0.0,
      r_elbow_flex_joint: -1.57,
      r_wrist_roll_joint: 0.0,
    };
    const waveLeft = {
      ...raisedPose,
      r_shoulder_out_joint: -0.12,
      r_upper_arm_roll_joint: 0.12,
    };
    const waveRight = {
      ...raisedPose,
      r_shoulder_out_joint: -0.32,
      r_upper_arm_roll_joint: -0.12,
    };

    return [
    {
      id: 'full',
      title: t('demo.fullTitle', 'Full Presentation'),
      description: t('demo.fullDesc', 'Complete demo: intro, head movement, wave, vision'),
      icon: PlayIcon,
      run: async (token: number) => {
        setDemoStepText(t('demo.stepIntro', 'Introduction...'));
        publishRobotCommand('presentation_intro');
        await setDemoPose({ head_tilt_joint: 0.2 }, token, 1500);
        await setDemoPose({ head_tilt_joint: 0 }, token, 1000);

        setDemoStepText(t('demo.stepHead', 'Head movement...'));
        await setDemoPose({ head_pan_joint: 0.5 }, token, 1200);
        await setDemoPose({ head_pan_joint: -0.5 }, token, 1200);
        await setDemoPose({ head_pan_joint: 0 }, token, 1000);

        setDemoStepText(t('demo.stepWave', 'Waving...'));
        publishRobotCommand('tete_centre');
        await setDemoPose(raisedPose, token, 1500);
        await setDemoPose(waveLeft, token, 600);
        await setDemoPose(waveRight, token, 600);
        await setDemoPose(waveLeft, token, 600);
        await setDemoPose(waveRight, token, 600);
        await setDemoPose(raisedPose, token, 800);

        setDemoStepText(t('demo.stepVision', 'Activating vision...'));
        if (isConnected && rosService?.isConnected()) {
          rosService.publish('/axel/vision/mode', 'std_msgs/String', { data: 'face_tracking' });
        }
        await sleep(1500);
        assertDemoToken(token);

        setDemoStepText(t('demo.stepRest', 'Returning to rest...'));
        await setDemoPose(SAFE_POSE, token, 1500);
      },
    },
    {
      id: 'hello',
      title: t('demo.helloTitle', 'Hello'),
      description: t('demo.helloDesc', 'Simple greeting with eyebrow movement'),
      icon: MicrophoneIcon,
      run: async (token: number) => {
        publishRobotCommand('presentation_hello');
        await setDemoPose({ head_tilt_joint: 0.3, r_shoulder_lift_joint: -0.3 }, token, 1200);
        await setDemoPose({ head_tilt_joint: 0, r_shoulder_lift_joint: 0 }, token, 1200);
      },
    },
    {
      id: 'wave',
      title: t('demo.waveTitle', 'Wave'),
      description: t('demo.waveDesc', 'Friendly waving gesture'),
      icon: HandRaisedIcon,
      run: async (token: number) => {
        publishRobotCommand('salam');
        await setDemoPose(raisedPose, token, 1500);
        await setDemoPose(waveLeft, token, 600);
        await setDemoPose(waveRight, token, 600);
        await setDemoPose(waveLeft, token, 600);
        await setDemoPose(waveRight, token, 600);
        await setDemoPose(raisedPose, token, 800);
        await setDemoPose(SAFE_POSE, token, 1200);
      },
    },
    {
      id: 'look_around',
      title: t('demo.lookAroundTitle', 'Look Around'),
      description: t('demo.lookAroundDesc', 'Scan the environment'),
      icon: EyeIcon,
      run: async (token: number) => {
        publishRobotCommand('look_left');
        await setDemoPose({ head_pan_joint: 0.6, head_tilt_joint: 0.1 }, token, 1200);
        await setDemoPose({ head_pan_joint: 0.6, head_tilt_joint: -0.1 }, token, 1000);
        
        publishRobotCommand('look_right');
        await setDemoPose({ head_pan_joint: -0.6, head_tilt_joint: -0.1 }, token, 1500);
        await setDemoPose({ head_pan_joint: -0.6, head_tilt_joint: 0.1 }, token, 1000);
        
        publishRobotCommand('tete_centre');
        await setDemoPose({ head_pan_joint: 0, head_tilt_joint: 0 }, token, 1200);
      },
    },
    {
      id: 'joy',
      title: t('demo.joyTitle', 'Joy / Celebration'),
      description: t('demo.joyDesc', 'A happy celebration gesture'),
      icon: SparklesIcon,
      run: async (token: number) => {
        const armsUp = {
          r_shoulder_lift_joint: -1.3,
          r_shoulder_out_joint: -0.2,
          r_elbow_flex_joint: -0.5,
          l_shoulder_lift_joint: -1.3,
          l_shoulder_out_joint: 0.2,
          l_elbow_flex_joint: -0.5,
          head_tilt_joint: -0.3,
        };
        const armsOut = {
          ...armsUp,
          r_shoulder_out_joint: -0.6,
          l_shoulder_out_joint: 0.6,
          head_tilt_joint: -0.1,
        };
        
        publishRobotCommand('joy'); // or similar
        await setDemoPose(armsUp, token, 1200);
        await setDemoPose(armsOut, token, 600);
        await setDemoPose(armsUp, token, 600);
        await setDemoPose(armsOut, token, 600);
        await setDemoPose(armsUp, token, 600);
        
        await setDemoPose(SAFE_POSE, token, 1500);
      },
    },
    {
      id: 'vision',
      title: t('demo.visionTitle', 'Vision'),
      description: t('demo.visionDesc', 'Activate face tracking'),
      icon: CameraIcon,
      run: async (token: number) => {
        if (isConnected && rosService?.isConnected()) {
          rosService.publish('/axel/vision/mode', 'std_msgs/String', { data: 'face_tracking' });
        }
        await sleep(900);
        assertDemoToken(token);
      },
    },
    {
      id: 'rest',
      title: t('demo.restTitle', 'Rest Position'),
      description: t('demo.restDesc', 'Return robot to safe/home position'),
      icon: HomeIcon,
      run: async (token: number) => {
        publishRobotCommand('home');
        await setDemoPose(SAFE_POSE, token);
      },
    },
  ];
  }, [isConnected, rosService, t, sendCommand, updateJointState, updateJointStates]);

  const runDemo = async (demo: DemoAction) => {
    if (demoStatus === 'running') return;

    setDemoStatus('running');
    setActiveDemoId(demo.id);
    setDemoStepText(`${t('demo.running', 'Running')}: ${demo.title}`);
    demoRunTokenRef.current += 1;
    const token = demoRunTokenRef.current;

    try {
      assertDemoToken(token);
      await demo.run(token);
      assertDemoToken(token);
      setDemoStatus('done');
      setDemoStepText(`${t('demo.done', 'Done')}: ${demo.title}`);
    } catch (error) {
      if (error instanceof Error && error.message === DEMO_STOPPED_ERROR) {
        return;
      }
      console.error('[Demo] Demo failed:', error);
      setDemoStatus('failed');
      setDemoStepText(`${t('demo.failed', 'Failed')}: ${demo.title}`);
    } finally {
      if (demoRunTokenRef.current !== token) return;
      window.setTimeout(() => {
        if (demoRunTokenRef.current !== token) return;
        setDemoStatus('ready');
        setActiveDemoId(null);
        setDemoStepText(t('demo.ready', 'Ready'));
      }, 2200);
    }
  };

  // When fresh /joint_states arrive while online, clear preview overrides gradually.
  React.useEffect(() => {
    if (!isConnected) return;
    // Any ROS update indicates the robot is publishing state; prefer that over preview.
    if (lastUpdate) {
      setPreviewJointStatesOnline({});
    }
  }, [isConnected, lastUpdate]);

  // UI normalization: present all joint sliders as 0..180 while preserving
  // underlying robot-specific min/max ranges from config.
  const toDisplayAngle = (rawAngle: number, min: number, max: number): number => {
    if (max === min) return 90;
    const normalized = ((rawAngle - min) / (max - min)) * 180;
    return Math.max(0, Math.min(180, normalized));
  };

  const toRawAngle = (displayAngle: number, min: number, max: number): number => {
    const clampedDisplay = Math.max(0, Math.min(180, displayAngle));
    return min + (clampedDisplay / 180) * (max - min);
  };

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

      // Also update local 3D preview immediately (so the model moves even if ROS doesn't echo /joint_states).
      const jointNameFromConfig = (config as any).jointName as string | undefined;
      const jointName = jointNameFromConfig || SERVO_ID_TO_JOINT_NAME[id];
      if (jointName) {
        const urdfAngle = angle - (config.default ?? 0);
        const radians = (urdfAngle * Math.PI) / 180;
        setPreviewJointStatesOnline((prev) => ({
          ...prev,
          [jointName]: radians,
        }));
      }
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

  const runGesture = async (gesture: 'salam' | 'home' | 'rest' | 'look_left' | 'look_right') => {
    if (gestureRunning) return;

    if (isConnected && rosService?.isConnected()) {
      const cmdMap: Record<string, string> = {
        salam: 'salam',
        home: 'home',
        rest: 'rest',
        look_left: 'look_left',
        look_right: 'look_right'
      };
      const cmd = cmdMap[gesture];
      if (cmd) {
        rosService.publish('/robot_command', 'std_msgs/String', { data: cmd });
        rosService.publish('/robot_function', 'std_msgs/String', { data: cmd });
        setGestureStatus(`Sent command: ${cmd}`);
        setTimeout(() => setGestureStatus(t('common.ready')), 1500);
      }
      return;
    }

    setGestureRunning(true);
    try {
      switch (gesture) {
        case 'home':
          setGestureStatus('Moving to home pose...');
          updateJointStates({
            r_shoulder_out_joint: 0,
            r_shoulder_lift_joint: 0,
            r_upper_arm_roll_joint: 0,
            r_elbow_flex_joint: 0,
            r_wrist_roll_joint: 0,
            l_shoulder_out_joint: 0,
            l_shoulder_lift_joint: 0,
            l_upper_arm_roll_joint: 0,
            l_elbow_flex_joint: 0,
            l_wrist_roll_joint: 0,
            head_tilt_joint: 0,
            head_pan_joint: 0,
            jaw_joint: 0,
          });
          break;
        case 'rest':
          setGestureStatus('Moving to rest pose...');
          updateJointStates({
            // Match robot/inmoov_moveit_config/scripts/trajectory_servers.py initial_positions.
            r_shoulder_out_joint: -0.567232006898157,
            r_shoulder_lift_joint: -0.7853981633974483,
            r_upper_arm_roll_joint: 0,
            r_elbow_flex_joint: -0.8290313946973065,
            r_wrist_roll_joint: -1.5707963267948966,
            l_shoulder_out_joint: 0.567232006898157,
            l_shoulder_lift_joint: -0.7853981633974483,
            l_upper_arm_roll_joint: 0,
            l_elbow_flex_joint: -0.8726646259971648,
            l_wrist_roll_joint: 1.5707963267948966,
          });
          break;
        case 'look_left':
          setGestureStatus('Looking left...');
          updateJointStates({ head_pan_joint: 0.35 });
          break;
        case 'look_right':
          setGestureStatus('Looking right...');
          updateJointStates({ head_pan_joint: -0.35 });
          break;
        case 'salam':
          setGestureStatus('Performing salam gesture...');
          // Match robot/inmoov_moveit_config/scripts/trajectory_servers.py right-arm wave.
          const rightArmInitial = {
            r_shoulder_out_joint: offlineJointStates.r_shoulder_out_joint ?? 0,
            r_shoulder_lift_joint: offlineJointStates.r_shoulder_lift_joint ?? 0,
            r_upper_arm_roll_joint: offlineJointStates.r_upper_arm_roll_joint ?? 0,
            r_elbow_flex_joint: offlineJointStates.r_elbow_flex_joint ?? 0,
            r_wrist_roll_joint: offlineJointStates.r_wrist_roll_joint ?? 0,
          };
          const rightHandJointNames = [
            'r_thumb1_joint', 'r_thumb_joint', 'r_thumb3_joint',
            'r_index1_joint', 'r_index_joint', 'r_index3_joint',
            'r_middle1_joint', 'r_middle_joint', 'r_middle3_joint',
            'r_ring1_joint', 'r_ring_joint', 'r_ring3_joint', 'r_ring4_joint',
            'r_pinky1_joint', 'r_pinky_joint', 'r_pinky3_joint', 'r_pinky4_joint',
          ] as const;
          const rightHandInitial = rightHandJointNames.reduce<Record<string, number>>((acc, jointName) => {
            acc[jointName] = offlineJointStates[jointName] ?? 0;
            return acc;
          }, {});
          const openRightHand = rightHandJointNames.reduce<Record<string, number>>((acc, jointName) => {
            acc[jointName] = 0;
            return acc;
          }, {});

          const raisedPose = {
            r_shoulder_out_joint: -0.10,
            r_shoulder_lift_joint: -1.10,
            r_upper_arm_roll_joint: 0.0,
            r_elbow_flex_joint: -1.57,
            r_wrist_roll_joint: 0.0,
          };
          const waveLeft = {
            ...raisedPose,
            r_shoulder_out_joint: -0.12,
            r_upper_arm_roll_joint: 0.12,
          };
          const waveRight = {
            ...raisedPose,
            r_shoulder_out_joint: -0.32,
            r_upper_arm_roll_joint: -0.12,
          };

          updateJointStates(openRightHand);
          await sleep(600);
          updateJointStates(raisedPose);
          await sleep(1600);

          for (let i = 0; i < 3; i += 1) {
            updateJointStates(waveLeft);
            await sleep(450);
            updateJointStates(waveRight);
            await sleep(450);
          }

          updateJointStates(rightArmInitial);
          await sleep(1800);
          updateJointStates(rightHandInitial);
          break;
      }
      setGestureStatus(t('common.done'));
    } catch (error) {
      setGestureStatus(t('common.failed'));
    } finally {
      window.setTimeout(() => setGestureStatus(t('common.ready')), 1800);
      setGestureRunning(false);
    }
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
      ...(isConnected ? previewJointStatesOnline : {}),
      ...offlineOverrides, // Only override with offline states when ROS is disconnected
    };
  }, [convertedServoStates, jointStatesByName, offlineJointStates, isConnected, previewJointStatesOnline]);

  return (
    <div id="visualization-page-root" className="p-6 h-full flex flex-col gap-6" style={{ background: 'var(--axel-bg)', color: 'var(--axel-text)' }}>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold axel-gradient-text mb-2 tracking-tight">
            {t('visual.title')}
          </h1>
          <p className="axel-muted font-medium">{t('visual.subtitle')}</p>
        </div>
        <div className="flex gap-2 items-center">
          <div
            className="px-5 py-2.5 rounded-xl font-bold tracking-wide text-sm border"
            style={{
              background: 'var(--axel-surface-soft)',
              borderColor: 'var(--axel-border)',
            }}
          >
            <span className="inline-flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'} ${isConnected ? 'animate-pulse' : ''}`} />
              <span className={isConnected ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}>
                {isConnected ? t('visual.connected') : t('visual.offline')}
              </span>
            </span>
          </div>
          {!isConnected && (
            <div />
          )}
          <label
            className="flex items-center gap-2 axel-card px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
            style={{ color: 'var(--axel-text)' }}
          >
            <input
              type="checkbox"
              checked={useEnhancedVisualization}
              onChange={(e) => setUseEnhancedVisualization(e.target.checked)}
              className="rounded text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
            />
            <span className="text-sm font-semibold">{t('visual.premiumView')}</span>
          </label>
        </div>
      </div>

      {!isConnected && (
        <div className="axel-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
          <p className="font-medium" style={{ color: 'var(--axel-text)' }}>
            <strong className="text-cyan-600 dark:text-cyan-300">{t('visual.offlineActive')}</strong> {t('visual.offlineHint')}
          </p>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 min-w-0 h-full relative rounded-2xl overflow-hidden border axel-surface" style={{ borderColor: 'var(--axel-border)' }}>
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
              onRunGesture={runGesture}
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

        <div className="w-[380px] flex flex-col rounded-2xl axel-surface border overflow-hidden" style={{ borderColor: 'var(--axel-border)' }}>
          <div className="border-b p-4" style={{ borderColor: 'var(--axel-border)' }}>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--axel-text)' }}>{t('visual.liveControl')}</h2>
              <div className="flex gap-3 text-[10px] axel-muted font-medium">
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div> {new Date(lastUpdate).toLocaleTimeString()}</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {Object.keys(servoStates).length} {t('visual.servos')}</span>
              </div>
            </div>

            <button
              onClick={handleResetRobot}
              className="w-full px-4 py-2 axel-button-secondary font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 tracking-wide"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              {t('visual.resetServos')}
            </button>

            {!isFullscreen && (
              <div className="mt-3 border-t border-slate-700/50 pt-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest axel-muted">Gestures</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => runGesture('salam')}
                  disabled={gestureRunning}
                    className="px-2 py-2 rounded-lg text-xs font-bold text-white bg-cyan-700/80 hover:bg-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed border border-cyan-500/30"
                  >
                    {t('visual.salam')}
                  </button>
                  <button
                  onClick={() => runGesture('home')}
                  disabled={gestureRunning}
                    className="px-2 py-2 rounded-lg text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-500/40"
                  >
                    {t('visual.home')}
                  </button>
                  <button
                  onClick={() => runGesture('rest')}
                  disabled={gestureRunning}
                    className="px-2 py-2 rounded-lg text-xs font-bold text-white bg-violet-700/80 hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed border border-violet-500/30"
                  >
                    {t('visual.rest')}
                  </button>
                  <button
                  onClick={() => runGesture('look_left')}
                  disabled={gestureRunning}
                    className="px-2 py-2 rounded-lg text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-500/40"
                  >
                    {t('visual.lookLeft')}
                  </button>
                  <button
                  onClick={() => runGesture('look_right')}
                  disabled={gestureRunning}
                    className="col-span-2 px-2 py-2 rounded-lg text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-500/40"
                  >
                    {t('visual.lookRight')}
                  </button>
                </div>
                <p className="text-[11px] axel-muted">{gestureStatus}</p>
              </div>
            )}

            {useEnhancedVisualization && (
              <div className="mt-3 border-t border-slate-700/50 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition-colors bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50 hover:border-slate-500/70 uppercase tracking-tighter">
                    <input
                      type="checkbox"
                      checked={showCollisions}
                      onChange={(e) => setShowCollisions(e.target.checked)}
                      className="w-3 h-3 rounded text-cyan-500 focus:ring-cyan-500/50 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    {t('visual.collisions')}
                  </label>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition-colors bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50 hover:border-slate-500/70 uppercase tracking-tighter">
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

          <div className="flex gap-2 p-3 border-b" style={{ background: 'var(--axel-surface-soft)', borderColor: 'var(--axel-border)' }}>
            <button
              onClick={() => setActiveTab('head')}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all text-xs tracking-wider ${activeTab === 'head'
                  ? 'axel-button-primary text-white'
                  : 'axel-button-secondary'
                }`}
            >
              HEAD ({headServoIds.length})
            </button>
            <button
              onClick={() => setActiveTab('arm')}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all text-xs tracking-wider ${activeTab === 'arm'
                  ? 'axel-button-primary text-white'
                  : 'axel-button-secondary'
                }`}
            >
              ARM ({armServoIds.length})
            </button>
            <button
              onClick={() => setActiveTab('mode')}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all text-xs tracking-wider ${activeTab === 'mode'
                  ? 'axel-button-primary text-white'
                  : 'axel-button-secondary'
                }`}
            >
              MODE
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex-1 px-3 py-2.5 rounded-xl font-bold transition-all text-xs tracking-wider ${activeTab === 'demo'
                  ? 'axel-button-primary text-white'
                  : 'axel-button-secondary'
                }`}
            >
              DEMO
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'demo' ? (
              <div className="h-full space-y-4">
                {/* Demo Status */}
                <div className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${
                  demoStatus === 'running' ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200' :
                  demoStatus === 'done' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200' :
                  demoStatus === 'failed' ? 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200' :
                  'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {demoStatus === 'running' ? (
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    ) : demoStatus === 'done' ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : demoStatus === 'failed' ? (
                      <StopCircleIcon className="w-5 h-5" />
                    ) : (
                      <ShieldCheckIcon className="w-5 h-5" />
                    )}
                    <span>{demoStepText}</span>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="p-3 rounded-xl border" style={{ background: 'var(--axel-surface-soft)', borderColor: 'var(--axel-border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs axel-muted uppercase tracking-wide">{t('demo.connection', 'Connection')}</span>
                    <span className={`text-sm font-bold ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {isConnected ? t('common.connected', 'Connected') : t('demo.simulationOnly', 'Simulation Only')}
                    </span>
                  </div>
                  <p className="text-xs axel-muted mt-1">
                    {isConnected 
                      ? t('demo.infoOnline', 'Demos will run on physical robot')
                      : t('demo.infoOffline', 'Demos will preview in 3D visualization')
                    }
                  </p>
                </div>

                {/* Stop Button */}
                {demoStatus === 'running' && (
                  <button
                    onClick={handleStopDemo}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-bold border border-rose-500/25 text-rose-700 dark:text-rose-200 bg-rose-500/10 hover:bg-rose-500/15 transition-all"
                  >
                    {t('demo.stopDemo', 'Stop Demo')}
                  </button>
                )}

                {/* Demo Actions */}
                <div className="space-y-2">
                  {demos.map((demo) => {
                    const Icon = demo.icon;
                    const active = activeDemoId === demo.id;
                    return (
                      <button
                        key={demo.id}
                        onClick={() => runDemo(demo)}
                        disabled={demoStatus === 'running'}
                        className={`w-full text-left p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                          active ? 'ring-2 ring-cyan-500/40 border-cyan-500/40' : ''
                        }`}
                        style={{ 
                          background: 'var(--axel-surface-soft)', 
                          borderColor: active ? undefined : 'var(--axel-border)'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--axel-surface)', border: '1px solid var(--axel-border)' }}>
                            <Icon className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold" style={{ color: 'var(--axel-text)' }}>{demo.title}</h3>
                            <p className="text-xs axel-muted mt-0.5">{demo.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'mode' ? (
              <div className="h-full">
                <ModeCard
                  onModeChange={onModeChange}
                  isConnected={isConnected}
                />
              </div>
            ) : activeTab === 'head' ? (
              <div className="space-y-3">
                {headServoIds.filter(id => ![1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15].includes(id)).map((servoId) => {
                  const config = getServoConfig(servoId);
                  // Prefer immediate UI value (optimistic) over ROS echo.
                  const optimistic = currentSliderValues[servoId];
                  const currentRawAngle =
                    typeof optimistic === 'number'
                      ? optimistic
                      : isConnected
                        ? (servoStates[servoId]?.angle ?? config.default)
                        : (config.default ?? 0);
                  const currentDisplayAngle = toDisplayAngle(currentRawAngle, config.min, config.max);

                  return (
                    <div
                      key={servoId}
                      className="group p-4 rounded-2xl transition-all border hover:border-cyan-500/30"
                      style={{ background: 'var(--axel-surface-soft)', borderColor: 'transparent' }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[11px] font-bold flex items-center gap-2 uppercase tracking-wide" style={{ color: 'var(--axel-text)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                          {config.name} <span className="axel-muted ml-1">#{servoId}</span>
                        </label>
                        <div className="px-2 py-1 rounded-lg text-xs font-mono shadow-inner border border-[color:var(--axel-border)] bg-[var(--axel-surface)] text-cyan-300">
                          {currentDisplayAngle.toFixed(1)}°
                        </div>
                      </div>
                      <ServoSlider
                        id={servoId}
                        label=""
                        value={currentDisplayAngle}
                        min={0}
                        max={180}
                        onChange={(displayValue) => {
                          const rawValue = toRawAngle(displayValue, config.min, config.max);
                          handleServoChange(servoId, rawValue);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {armServoIds.map((servoId) => {
                  const config = getServoConfig(servoId);
                  // Prefer immediate UI value (optimistic) over ROS echo.
                  const optimistic = currentSliderValues[servoId];
                  const currentRawAngle =
                    typeof optimistic === 'number'
                      ? optimistic
                      : isConnected
                        ? (servoStates[servoId]?.angle ?? config.default)
                        : (config.default ?? 0);
                  const currentDisplayAngle = toDisplayAngle(currentRawAngle, config.min, config.max);

                  return (
                    <div
                      key={servoId}
                      className="group p-4 rounded-2xl transition-all border hover:border-cyan-500/30"
                      style={{ background: 'var(--axel-surface-soft)', borderColor: 'transparent' }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[11px] font-bold flex items-center gap-2 uppercase tracking-wide" style={{ color: 'var(--axel-text)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                          {config.name} <span className="axel-muted ml-1">#{servoId}</span>
                        </label>
                        <div className="px-2 py-1 rounded-lg text-xs font-mono shadow-inner border border-[color:var(--axel-border)] bg-[var(--axel-surface)] text-cyan-300">
                          {currentDisplayAngle.toFixed(1)}°
                        </div>
                      </div>
                      <ServoSlider
                        id={servoId}
                        label=""
                        value={currentDisplayAngle}
                        min={0}
                        max={180}
                        onChange={(displayValue) => {
                          const rawValue = toRawAngle(displayValue, config.min, config.max);
                          handleServoChange(servoId, rawValue);
                        }}
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
