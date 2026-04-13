import React, { useEffect, useRef, useState } from 'react';
import RobotViewer from './RobotViewer';

interface Startup3DIntroProps {
  onComplete: () => void;
}

const INTRO_DURATION_MS = 7000;

function buildIntroPose(timeSeconds: number): Record<number, number> {
  const waveFast = Math.sin(timeSeconds * 5.6);
  const waveSlow = Math.sin(timeSeconds * 1.7);
  const smilePulse = Math.max(0, Math.sin(timeSeconds * 2.1));

  return {
    // Head / face
    1: 10 * Math.sin(timeSeconds * 1.8 + 0.4), // head_tilt_joint
    2: 24 * Math.sin(timeSeconds * 1.1), // head_pan_joint
    3: 10 + 14 * smilePulse, // jaw_joint
    4: 7 * Math.sin(timeSeconds * 2.1), // eyes_tilt_joint
    5: 12 * Math.sin(timeSeconds * 1.9 + 0.3), // eyes_pan_joint
    6: 12 * Math.sin(timeSeconds * 1.9 + 0.3), // l_eye_pan_joint

    // Right arm "salam" wave
    7: 42 + 14 * waveSlow, // r_shoulder_out_joint
    8: 62 + 16 * waveSlow, // r_shoulder_lift_joint
    9: 24 * Math.sin(timeSeconds * 2.0), // r_upper_arm_roll_joint
    10: 72 + 18 * waveSlow, // r_elbow_flex_joint
    11: 85 * waveFast, // r_wrist_roll_joint

    // Left arm gentle support motion
    12: -14 - 7 * waveSlow, // l_shoulder_out_joint
    13: 26 + 8 * waveSlow, // l_shoulder_lift_joint
    14: -12 * Math.sin(timeSeconds * 1.2), // l_upper_arm_roll_joint
    15: 34 + 10 * waveSlow, // l_elbow_flex_joint
    16: -18 * Math.sin(timeSeconds * 2.2), // l_wrist_roll_joint
  };
}

const Startup3DIntro: React.FC<Startup3DIntroProps> = ({ onComplete }) => {
  const [joints, setJoints] = useState<Record<number, number>>({});
  const [modelReady, setModelReady] = useState(false);
  const [modelReadyAt, setModelReadyAt] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
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
      const t = elapsedMs / 1000;
      setJoints(buildIntroPose(t));

      if (modelReady && modelReadyAt !== null && timestamp - modelReadyAt >= INTRO_DURATION_MS) {
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
          joints={joints}
          isConnected={false}
          showFitButton={false}
          showLoadingOverlay={true}
          showLoadingDetails={false}
          showControlsHint={false}
          onModelReady={() => setModelReady(true)}
        />
      </div>

      <div className="absolute top-8 left-8 bg-black/45 border border-gray-700 rounded-xl px-5 py-4">
        <h2 className="text-xl font-bold text-white">AXEL Startup Sequence</h2>
        <p className="text-sm text-gray-300 mt-1">
          {modelReady ? 'Greeting motion online...' : 'Initializing 3D model and motion profile...'}
        </p>
      </div>
    </div>
  );
};

export default Startup3DIntro;
