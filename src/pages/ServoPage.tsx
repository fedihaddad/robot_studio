import React, { useState } from 'react';
import ServoSlider from '../components/shared/ServoSlider';
import IKControlPanel from '../components/shared/IKControlPanel';
import { ServoCommand, ServoPreset, IKSolution } from '../types';
import { useAppStore } from '../store/appStore';

interface ServoPageProps {
  onServoCommand: (command: ServoCommand) => void;
}

const ServoPage: React.FC<ServoPageProps> = ({ onServoCommand }) => {
  const { t } = useAppStore();
  // Head servos: 15 servos for various head movements
  const [headServos, setHeadServos] = useState<Record<number, number>>({
    1: 90, 2: 90, 3: 90, 4: 90, 5: 90,      // Pan/tilt, eye blinks
    6: 90, 7: 90, 8: 90,                      // Mouth
    9: 90, 10: 90, 11: 90, 12: 90, 13: 90,   // Eyebrows, expressions
    14: 90, 15: 90,                            // Additional adjustments
  });

  // Arm servos: MG996R servos for arms
  const [armServos, setArmServos] = useState<Record<number, number>>({
    16: 90, 17: 90, 18: 90, 19: 90, 20: 90,  // Left arm
    21: 90, 22: 90, 23: 90, 24: 90, 25: 90,  // Right arm
  });

  // IK Control state
  const [ikMode, setIkMode] = useState<'direct' | 'inverse_kinematics'>('direct');
  const [isExecutingIK, setIsExecutingIK] = useState(false);

  const presets: Record<string, ServoPreset> = {
    neutral: {
      name: t('servo.neutral'),
      description: t('servo.neutralDesc'),
      positions: new Map(
        Object.entries({
          1: 90, 2: 90, 3: 90, 4: 90, 5: 90,
          6: 90, 7: 90, 8: 90, 9: 90, 10: 90,
          11: 90, 12: 90, 13: 90, 14: 90, 15: 90,
          16: 90, 17: 90, 18: 90, 19: 90, 20: 90,
          21: 90, 22: 90, 23: 90, 24: 90, 25: 90,
        }).map(([k, v]) => [parseInt(k), v])
      ),
    },
    wave: {
      name: t('servo.wave'),
      description: t('servo.waveDesc'),
      positions: new Map([
        [16, 45], [17, 60], [18, 75], [19, 90], [20, 90],
        [21, 135], [22, 120], [23, 105], [24, 90], [25, 90],
      ]),
    },
    lookLeft: {
      name: t('servo.lookLeft'),
      description: t('servo.lookLeftDesc'),
      positions: new Map(
        Array.from({ length: 25 }, (_, i) => [
          i + 1,
          i + 1 <= 3 ? 45 : 90,
        ])
      ),
    },
    lookRight: {
      name: t('servo.lookRight'),
      description: t('servo.lookRightDesc'),
      positions: new Map(
        Array.from({ length: 25 }, (_, i) => [
          i + 1,
          i + 1 <= 3 ? 135 : 90,
        ])
      ),
    },
  };

  const handleHeadServoChange = (id: number, value: number) => {
    setHeadServos(prev => ({ ...prev, [id]: value }));
    onServoCommand({ id, angle: value });
  };

  const handleArmServoChange = (id: number, value: number) => {
    setArmServos(prev => ({ ...prev, [id]: value }));
    onServoCommand({ id, angle: value });
  };

  const applyPreset = (preset: ServoPreset) => {
    const newHead: Record<number, number> = {};
    const newArm: Record<number, number> = {};

    preset.positions.forEach((angle, id) => {
      if (id <= 15) {
        newHead[id] = angle;
      } else {
        newArm[id] = angle;
      }
      onServoCommand({ id, angle });
    });

    setHeadServos(prev => ({ ...prev, ...newHead }));
    setArmServos(prev => ({ ...prev, ...newArm }));
  };

  // Handle IK Solution execution
  const handleIKExecution = (solution: IKSolution, armName: 'left_arm' | 'right_arm') => {
    if (!solution.valid) return;

    setIsExecutingIK(true);

    // Map IK solution angles to servo IDs
    // Left arm: 16-20 (shoulder, elbow, wrist, spare1, spare2)
    // Right arm: 21-25 (shoulder, elbow, wrist, spare1, spare2)
    const baseId = armName === 'left_arm' ? 16 : 21;

    // Execute shoulder move
    onServoCommand({
      id: baseId,
      angle: solution.angles.shoulder,
    });

    // Execute elbow move
    setTimeout(() => {
      onServoCommand({
        id: baseId + 1,
        angle: solution.angles.elbow,
      });
    }, 150);

    // Execute wrist move if available
    if (solution.angles.wrist) {
      setTimeout(() => {
        onServoCommand({
          id: baseId + 2,
          angle: solution.angles.wrist,
        });
      }, 300);
    }

    // Update state
    const newArmServos = {
      [baseId]: solution.angles.shoulder,
      [baseId + 1]: solution.angles.elbow,
      [baseId + 2]: solution.angles.wrist || 90,
    };

    setArmServos(prev => ({ ...prev, ...newArmServos }));

    // Reset executing state after animation
    setTimeout(() => {
      setIsExecutingIK(false);
    }, 500);
  };

  return (
    <div className="p-6 md:p-8 space-y-8" style={{ background: 'var(--axel-bg)', color: 'var(--axel-text)' }}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold axel-gradient-text mb-2">{t('servo.title')}</h1>
          <p className="axel-muted">{t('servo.subtitle')}</p>
        </div>
      </div>

      {/* Control Mode Toggle */}
      <div className="axel-surface rounded-2xl p-4 border" style={{ borderColor: 'var(--axel-border)' }}>
        <h3 className="text-sm font-extrabold mb-3" style={{ color: 'var(--axel-text)' }}>{t('servo.controlMode')}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIkMode('direct')}
            className={`flex-1 px-4 py-2 rounded-xl font-bold transition-colors ${
              ikMode === 'direct'
                ? 'axel-button-primary text-white'
                : 'axel-button-secondary'
            }`}
          >
            {t('servo.direct')}
          </button>
          <button
            onClick={() => setIkMode('inverse_kinematics')}
            className={`flex-1 px-4 py-2 rounded-xl font-bold transition-colors ${
              ikMode === 'inverse_kinematics'
                ? 'axel-button-primary text-white'
                : 'axel-button-secondary'
            }`}
          >
            {t('servo.ik')}
          </button>
        </div>
      </div>

      {/* Preset Buttons - Only in Direct Mode */}
      {ikMode === 'direct' && (
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(preset)}
              className="axel-button-primary px-4 py-3 rounded-2xl font-extrabold transition-colors text-white flex flex-col items-center gap-1"
            >
              <span className="text-lg">{preset.name}</span>
              <span className="text-xs opacity-85">{preset.description}</span>
            </button>
          ))}
        </div>
      )}

      {ikMode === 'direct' && (
        <div className="grid grid-cols-2 gap-8">
          {/* Head Servos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--axel-text)' }}>{t('servo.headServos')}</h2>
              <span className="text-sm axel-muted">(15 servos)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((id) => (
                <ServoSlider
                  key={id}
                  id={id}
                  label={t('servo.servo')}
                  value={headServos[id] || 90}
                  onChange={(value) => handleHeadServoChange(id, value)}
                />
              ))}
            </div>
          </div>

          {/* Arm Servos - Direct */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--axel-text)' }}>{t('servo.armServos')}</h2>
              <span className="text-sm axel-muted">(10 servos)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Left Arm */}
              <div>
                <h3 className="text-sm font-extrabold mb-2 text-cyan-600 dark:text-cyan-300">{t('servo.leftArm')}</h3>
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, i) => 16 + i).map((id) => (
                    <ServoSlider
                      key={id}
                      id={id}
                      label={t('servo.left')}
                      value={armServos[id] || 90}
                      onChange={(value) => handleArmServoChange(id, value)}
                    />
                  ))}
                </div>
              </div>

              {/* Right Arm */}
              <div>
                <h3 className="text-sm font-extrabold mb-2 text-emerald-600 dark:text-emerald-300">{t('servo.rightArm')}</h3>
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, i) => 21 + i).map((id) => (
                    <ServoSlider
                      key={id}
                      id={id}
                      label={t('servo.right')}
                      value={armServos[id] || 90}
                      onChange={(value) => handleArmServoChange(id, value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {ikMode === 'inverse_kinematics' && (
        <div className="grid grid-cols-2 gap-8">
          {/* Left Arm IK */}
          <IKControlPanel
            armName="left_arm"
            onExecution={(solution) => handleIKExecution(solution, 'left_arm')}
            isExecuting={isExecutingIK}
          />

          {/* Right Arm IK */}
          <IKControlPanel
            armName="right_arm"
            onExecution={(solution) => handleIKExecution(solution, 'right_arm')}
            isExecuting={isExecutingIK}
          />
        </div>
      )}

      {/* Quick Info */}
      <div className="axel-surface rounded-2xl p-6 border" style={{ borderColor: 'var(--axel-border)' }}>
        <h3 className="text-lg font-extrabold mb-3" style={{ color: 'var(--axel-text)' }}>{t('servo.info')}</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="axel-muted">{t('servo.headServos')}</p>
            <p className="text-xl font-extrabold text-cyan-600 dark:text-cyan-300">15x MG90/MG90S</p>
          </div>
          <div>
            <p className="axel-muted">{t('servo.armServos')}</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-300">10x MG996R</p>
          </div>
          <div>
            <p className="axel-muted">{t('servo.controlInterface')}</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-300">2x PCA9685</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServoPage;
