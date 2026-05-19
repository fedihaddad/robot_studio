import React, { useMemo, useRef, useState } from 'react';
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
import { ROSService } from '../services/ros.service';
import { useAppStore } from '../store/appStore';
import { ServoCommand } from '../types';

interface DemoModePageProps {
  rosService: ROSService | null;
  rosConnected: boolean;
  onServoCommand: (command: ServoCommand) => void;
  emergencyStopActive?: boolean;
}

type DemoStatus = 'ready' | 'running' | 'done' | 'blocked' | 'failed';

interface DemoAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  run: () => Promise<void>;
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
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

const DemoModePage: React.FC<DemoModePageProps> = ({
  rosService,
  rosConnected,
  onServoCommand,
  emergencyStopActive = false,
}) => {
  const { updateJointStates, t } = useAppStore();
  const [status, setStatus] = useState<DemoStatus>('ready');
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);
  const [stepText, setStepText] = useState(t('demo.ready'));
  const runTokenRef = useRef(0);

  const canRun = !emergencyStopActive && status !== 'running';
  const isRunning = status === 'running';

  const assertRunToken = (token: number) => {
    if (runTokenRef.current !== token) {
      throw new Error(DEMO_STOPPED_ERROR);
    }
  };

  const publishServo = async (id: number, angle: number, token: number, delay = 250) => {
    assertRunToken(token);
    onServoCommand({ id, angle });
    await sleep(delay);
    assertRunToken(token);
  };

  const publishRobotCommand = (command: string) => {
    if (rosConnected && rosService?.isConnected()) {
      rosService.publish('/robot_command', 'std_msgs/String', { data: command });
      rosService.publish('/robot_function', 'std_msgs/String', { data: command });
    }
  };

  const setOfflinePose = async (pose: Record<string, number>, token?: number, delay = 500) => {
    if (typeof token === 'number') assertRunToken(token);
    updateJointStates(pose);
    await sleep(delay);
    if (typeof token === 'number') assertRunToken(token);
  };

  const returnToSafePose = async () => {
    publishRobotCommand('home');
    await setOfflinePose(SAFE_POSE, undefined, 350);
  };

  const handleStopDemo = async () => {
    if (!isRunning) return;
    runTokenRef.current += 1; // cancel current run
    setStepText(t('demo.stopping'));
    await returnToSafePose();
    setStatus('ready');
    setActiveDemoId(null);
    setStepText(t('demo.ready'));
  };

  const runDemo = async (demo: DemoAction) => {
    if (!canRun) {
      setStatus('blocked');
      setStepText(emergencyStopActive ? t('demo.blockedEstop') : t('demo.blockedBusy'));
      return;
    }

    setStatus('running');
    setActiveDemoId(demo.id);
    setStepText(`${t('demo.running')}: ${demo.title}`);
    runTokenRef.current += 1;
    const token = runTokenRef.current;

    try {
      assertRunToken(token);
      await demo.run();
      assertRunToken(token);
      setStatus('done');
      setStepText(`${t('demo.done')}: ${demo.title}`);
    } catch (error) {
      if (error instanceof Error && error.message === DEMO_STOPPED_ERROR) {
        return;
      }
      console.error('[DemoMode] Demo failed:', error);
      setStatus('failed');
      setStepText(`${t('demo.failed')}: ${demo.title}`);
    } finally {
      if (runTokenRef.current !== token) return;
      window.setTimeout(() => {
        if (runTokenRef.current !== token) return;
        setStatus('ready');
        setActiveDemoId(null);
        setStepText(t('demo.ready'));
      }, 2200);
    }
  };

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
        title: t('demo.fullTitle'),
        description: t('demo.fullDesc'),
        icon: PlayIcon,
        run: async () => {
          const token = runTokenRef.current;
          setStepText(t('demo.stepIntro'));
          publishRobotCommand('presentation_intro');
          await setOfflinePose({ head_tilt_joint: 0.2 }, token, 1500);
          await setOfflinePose({ head_tilt_joint: 0 }, token, 1000);

          setStepText(t('demo.stepHead'));
          await setOfflinePose({ head_pan_joint: 0.5 }, token, 1200);
          await setOfflinePose({ head_pan_joint: -0.5 }, token, 1200);
          await setOfflinePose({ head_pan_joint: 0 }, token, 1000);

          setStepText(t('demo.stepWave'));
          publishRobotCommand('tete_centre');
          await setOfflinePose(raisedPose, token, 1500);
          await setOfflinePose(waveLeft, token, 600);
          await setOfflinePose(waveRight, token, 600);
          await setOfflinePose(waveLeft, token, 600);
          await setOfflinePose(waveRight, token, 600);
          await setOfflinePose(raisedPose, token, 800);

          setStepText(t('demo.stepVision'));
          if (rosConnected && rosService?.isConnected()) {
            rosService.publish('/axel/vision/mode', 'std_msgs/String', { data: 'face_tracking' });
          }
          await sleep(1500);
          assertRunToken(token);

          setStepText(t('demo.stepRest'));
          await setOfflinePose(SAFE_POSE, token, 1500);
        },
      },
      {
        id: 'hello',
        title: t('demo.helloTitle'),
        description: t('demo.helloDesc'),
        icon: MicrophoneIcon,
        run: async () => {
          const token = runTokenRef.current;
          publishRobotCommand('presentation_hello');
          await setOfflinePose({ head_tilt_joint: 0.3, r_shoulder_lift_joint: -0.3 }, token, 1200);
          await setOfflinePose({ head_tilt_joint: 0, r_shoulder_lift_joint: 0 }, token, 1200);
        },
      },
      {
        id: 'wave',
        title: t('demo.waveTitle'),
        description: t('demo.waveDesc'),
        icon: HandRaisedIcon,
        run: async () => {
          const token = runTokenRef.current;
          publishRobotCommand('salam');
          await setOfflinePose(raisedPose, token, 1500);
          await setOfflinePose(waveLeft, token, 600);
          await setOfflinePose(waveRight, token, 600);
          await setOfflinePose(waveLeft, token, 600);
          await setOfflinePose(waveRight, token, 600);
          await setOfflinePose(raisedPose, token, 800);
          await setOfflinePose(SAFE_POSE, token, 1200);
        },
      },
      {
        id: 'look_around',
        title: t('demo.lookAroundTitle', 'Look Around'),
        description: t('demo.lookAroundDesc', 'Scan the environment'),
        icon: EyeIcon,
        run: async () => {
          const token = runTokenRef.current;
          publishRobotCommand('look_left');
          await setOfflinePose({ head_pan_joint: 0.6, head_tilt_joint: 0.1 }, token, 1200);
          await setOfflinePose({ head_pan_joint: 0.6, head_tilt_joint: -0.1 }, token, 1000);

          publishRobotCommand('look_right');
          await setOfflinePose({ head_pan_joint: -0.6, head_tilt_joint: -0.1 }, token, 1500);
          await setOfflinePose({ head_pan_joint: -0.6, head_tilt_joint: 0.1 }, token, 1000);

          publishRobotCommand('tete_centre');
          await setOfflinePose({ head_pan_joint: 0, head_tilt_joint: 0 }, token, 1200);
        },
      },
      {
        id: 'joy',
        title: t('demo.joyTitle', 'Joy / Celebration'),
        description: t('demo.joyDesc', 'A happy celebration gesture'),
        icon: SparklesIcon,
        run: async () => {
          const token = runTokenRef.current;
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

          publishRobotCommand('joy');
          await setOfflinePose(armsUp, token, 1200);
          await setOfflinePose(armsOut, token, 600);
          await setOfflinePose(armsUp, token, 600);
          await setOfflinePose(armsOut, token, 600);
          await setOfflinePose(armsUp, token, 600);

          await setOfflinePose(SAFE_POSE, token, 1500);
        },
      },
      {
        id: 'vision',
        title: t('demo.visionTitle'),
        description: t('demo.visionDesc'),
        icon: CameraIcon,
        run: async () => {
          const token = runTokenRef.current;
          if (rosConnected && rosService?.isConnected()) {
            rosService.publish('/axel/vision/mode', 'std_msgs/String', { data: 'face_tracking' });
          }
          await sleep(900);
          assertRunToken(token);
        },
      },
      {
        id: 'rest',
        title: t('demo.restTitle'),
        description: t('demo.restDesc'),
        icon: HomeIcon,
        run: async () => {
          const token = runTokenRef.current;
          publishRobotCommand('home');
          await setOfflinePose(SAFE_POSE, token);
        },
      },
    ];
  }, [onServoCommand, rosConnected, rosService, t, updateJointStates]);

  const statusStyles: Record<DemoStatus, string> = {
    ready: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200',
    running: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200',
    done: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
    blocked: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200',
    failed: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200',
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen" style={{ background: 'var(--axel-bg)', color: 'var(--axel-text)' }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center">
              <BoltIcon className="w-7 h-7 text-cyan-600 dark:text-cyan-300" aria-hidden />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold axel-gradient-text">
              {t('demo.title')}
            </h1>
          </div>
          <p className="axel-muted max-w-2xl">
            {t('demo.subtitle')}
          </p>
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${statusStyles[status]}`}>
          <div className="flex items-center gap-2">
            {status === 'running' ? (
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            ) : status === 'done' ? (
              <CheckCircleIcon className="w-5 h-5" aria-hidden />
            ) : status === 'blocked' || status === 'failed' ? (
              <StopCircleIcon className="w-5 h-5" aria-hidden />
            ) : (
              <ShieldCheckIcon className="w-5 h-5" aria-hidden />
            )}
            <span>{stepText}</span>
          </div>
        </div>
      </div>

      {isRunning && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleStopDemo}
            className="axel-button-secondary px-4 py-2.5 rounded-xl text-sm font-extrabold border border-rose-500/25 text-rose-700 dark:text-rose-200 bg-rose-500/10 hover:bg-rose-500/15"
          >
            {t('demo.stopDemo')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="axel-card p-5">
          <p className="text-xs uppercase tracking-widest axel-muted mb-2">{t('demo.safety')}</p>
          <p className={`text-lg font-extrabold ${emergencyStopActive ? 'text-rose-500' : 'text-emerald-500'}`}>
            {emergencyStopActive ? t('demo.estopActive') : t('demo.safeReady')}
          </p>
        </div>
        <div className="axel-card p-5">
          <p className="text-xs uppercase tracking-widest axel-muted mb-2">ROS</p>
          <p className={`text-lg font-extrabold ${rosConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
            {rosConnected ? t('common.connected') : t('demo.simulationOnly')}
          </p>
        </div>
        <div className="axel-card p-5">
          <p className="text-xs uppercase tracking-widest axel-muted mb-2">{t('demo.presentation')}</p>
          <p className="text-lg font-extrabold text-cyan-600 dark:text-cyan-300">
            {t('demo.oneClick')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {demos.map((demo) => {
          const Icon = demo.icon;
          const active = activeDemoId === demo.id;
          return (
            <button
              key={demo.id}
              type="button"
              onClick={() => runDemo(demo)}
              disabled={!canRun}
              className={`text-left axel-surface border rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-55 disabled:cursor-not-allowed ${active ? 'ring-2 ring-cyan-500/40 border-cyan-500/40' : ''
                }`}
              style={{ borderColor: active ? undefined : 'var(--axel-border)' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[var(--axel-surface-soft)] border border-[color:var(--axel-border)] flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-cyan-600 dark:text-cyan-300" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold" style={{ color: 'var(--axel-text)' }}>
                    {demo.title}
                  </h2>
                  <p className="text-sm axel-muted mt-1 leading-relaxed">
                    {demo.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default DemoModePage;
