import React, { useEffect, useRef, useState } from 'react';
import RobotViewer from './RobotViewer';

interface Startup3DIntroProps {
  onComplete: () => void;
}

const INTRO_DURATION_TOTAL_MS = 12000;

const RIGHT_HAND_JOINTS = [
  'r_thumb1_joint', 'r_thumb_joint', 'r_thumb3_joint',
  'r_index1_joint', 'r_index_joint', 'r_index3_joint',
  'r_middle1_joint', 'r_middle_joint', 'r_middle3_joint',
  'r_ring1_joint', 'r_ring_joint', 'r_ring3_joint', 'r_ring4_joint',
  'r_pinky1_joint', 'r_pinky_joint', 'r_pinky3_joint', 'r_pinky4_joint',
] as const;

const LEFT_HAND_JOINTS = [
  'l_thumb1_joint', 'l_thumb_joint', 'l_thumb3_joint',
  'l_index1_joint', 'l_index_joint', 'l_index3_joint',
  'l_middle1_joint', 'l_middle_joint', 'l_middle3_joint',
  'l_ring1_joint', 'l_ring_joint', 'l_ring3_joint', 'l_ring4_joint',
  'l_pinky1_joint', 'l_pinky_joint', 'l_pinky3_joint', 'l_pinky4_joint',
] as const;

const withHandOpen = (pose: Record<string, number>): Record<string, number> => {
  const next = { ...pose };
  RIGHT_HAND_JOINTS.forEach((joint) => { next[joint] = 0; });
  LEFT_HAND_JOINTS.forEach((joint) => { next[joint] = 0; });
  return next;
};

const HOME_POSE = withHandOpen({
  head_pan_joint: 0,
  head_tilt_joint: 0,
  head_roll_joint: 0,
  eyes_pan_joint: 0,
  l_eye_pan_joint: 0,
  eyes_tilt_joint: 0,
  jaw_joint: 0,
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
});

const LOOK_LEFT_POSE = {
  ...HOME_POSE,
  head_pan_joint: 0.55,
  eyes_pan_joint: 0.35,
  l_eye_pan_joint: 0.35,
};

const LOOK_RIGHT_POSE = {
  ...HOME_POSE,
  head_pan_joint: -0.55,
  eyes_pan_joint: -0.35,
  l_eye_pan_joint: -0.35,
};

const SALAM_RAISED_POSE = {
  ...HOME_POSE,
  r_shoulder_out_joint: -0.10,
  r_shoulder_lift_joint: -1.10,
  r_upper_arm_roll_joint: 0.0,
  r_elbow_flex_joint: -1.57,
  r_wrist_roll_joint: 0.0,
  head_pan_joint: 0.08,
};

const SALAM_WAVE_LEFT_POSE = {
  ...SALAM_RAISED_POSE,
  r_shoulder_out_joint: -0.12,
  r_upper_arm_roll_joint: 0.12,
};

const SALAM_WAVE_RIGHT_POSE = {
  ...SALAM_RAISED_POSE,
  r_shoulder_out_joint: -0.32,
  r_upper_arm_roll_joint: -0.12,
};

const interpolatePose = (
  from: Record<string, number>,
  to: Record<string, number>,
  t: number
): Record<string, number> => {
  const eased = Math.max(0, Math.min(1, t));
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  const pose: Record<string, number> = {};
  keys.forEach((key) => {
    const a = from[key] ?? 0;
    const b = to[key] ?? 0;
    pose[key] = a + (b - a) * eased;
  });
  return pose;
};

function buildIntroPose(elapsedMs: number): Record<string, number> {
  const easeInOut = (t: number) => {
    const x = Math.max(0, Math.min(1, t));
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  };

  if (elapsedMs <= 1800) {
    return HOME_POSE;
  }
  if (elapsedMs <= 3600) {
    return interpolatePose(HOME_POSE, LOOK_LEFT_POSE, easeInOut((elapsedMs - 1800) / 1800));
  }
  if (elapsedMs <= 5400) {
    return interpolatePose(LOOK_LEFT_POSE, LOOK_RIGHT_POSE, easeInOut((elapsedMs - 3600) / 1800));
  }
  if (elapsedMs <= 6800) {
    return interpolatePose(LOOK_RIGHT_POSE, HOME_POSE, easeInOut((elapsedMs - 5400) / 1400));
  }
  if (elapsedMs <= 8600) {
    return interpolatePose(HOME_POSE, SALAM_RAISED_POSE, easeInOut((elapsedMs - 6800) / 1800));
  }

  const waveStart = 8600;
  const waveCycleMs = 700;
  const waveHalfMs = waveCycleMs / 2;
  const waveCycles = 3;
  const waveTotalMs = waveCycles * waveCycleMs;
  const waveElapsed = elapsedMs - waveStart;

  if (waveElapsed <= waveTotalMs) {
    const inCycle = waveElapsed % waveCycleMs;
    if (inCycle < waveHalfMs) {
      return interpolatePose(
        SALAM_WAVE_RIGHT_POSE,
        SALAM_WAVE_LEFT_POSE,
        easeInOut(inCycle / waveHalfMs)
      );
    }
    return interpolatePose(
      SALAM_WAVE_LEFT_POSE,
      SALAM_WAVE_RIGHT_POSE,
      easeInOut((inCycle - waveHalfMs) / waveHalfMs)
    );
  }

  const returnStart = waveStart + waveTotalMs;
  if (elapsedMs <= INTRO_DURATION_TOTAL_MS) {
    return interpolatePose(
      SALAM_RAISED_POSE,
      HOME_POSE,
      easeInOut((elapsedMs - returnStart) / (INTRO_DURATION_TOTAL_MS - returnStart))
    );
  }

  return HOME_POSE;
}

const Startup3DIntro: React.FC<Startup3DIntroProps> = ({ onComplete }) => {
  const [jointStatesByName, setJointStatesByName] = useState<Record<string, number>>({});
  const [modelReady, setModelReady] = useState(false);
  const [modelReadyAt, setModelReadyAt] = useState<number | null>(null);
  const [showCenteredBrand, setShowCenteredBrand] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastPoseUpdateRef = useRef<number>(0);
  const hasShownBrandRef = useRef(false);
  const didCompleteRef = useRef(false);

  const completeIntro = () => {
    if (didCompleteRef.current) return;
    didCompleteRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onComplete();
  };

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsedMs = timestamp - startTimeRef.current;
      // Throttle pose updates to ~30 FPS to keep intro smooth.
      if (timestamp - lastPoseUpdateRef.current >= 33) {
        lastPoseUpdateRef.current = timestamp;
        setJointStatesByName(buildIntroPose(elapsedMs));
      }

      if (!hasShownBrandRef.current && elapsedMs >= INTRO_DURATION_TOTAL_MS * 0.72) {
        hasShownBrandRef.current = true;
        setShowCenteredBrand(true);
      }

      if (modelReady && modelReadyAt !== null && timestamp - modelReadyAt >= INTRO_DURATION_TOTAL_MS) {
        completeIntro();
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [modelReady, modelReadyAt]);

  useEffect(() => {
    if (!modelReady || modelReadyAt !== null) return;
    setModelReadyAt(performance.now());
  }, [modelReady, modelReadyAt]);

  useEffect(() => {
    // Fail-open safeguard: only when model never becomes ready.
    // Once ready, intro duration is controlled only by INTRO_DURATION_MS.
    if (modelReady) return;
    const hardTimeout = window.setTimeout(() => {
      completeIntro();
    }, 25000);

    return () => window.clearTimeout(hardTimeout);
  }, [modelReady]);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-sm">
      <div className="absolute inset-0">
        <RobotViewer
          joints={{}}
          jointStatesByName={jointStatesByName}
          isConnected={false}
          showFitButton={false}
          showLoadingOverlay={false}
          showLoadingDetails={false}
          showControlsHint={false}
          isIntroMode={true}
          onModelReady={() => setModelReady(true)}
        />
      </div>

      <button
        onClick={completeIntro}
        className="absolute top-8 right-8 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors"
      >
        Skip Intro
      </button>

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-700 ${
          modelReady && showCenteredBrand ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <h1 className="text-6xl md:text-7xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.35)]">
          AXEL
        </h1>
      </div>
    </div>
  );
};

export default Startup3DIntro;
