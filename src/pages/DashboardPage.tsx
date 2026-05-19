import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  WrenchScrewdriverIcon,
  StopCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import EmergencyStopButton from '../components/shared/EmergencyStopButton';
import { RobotState, ROSState, RobotMode } from '../types';
import { useAppStore } from '../store/appStore';

interface DashboardPageProps {
  rosState: ROSState;
  cameraConnected: boolean;
  onEmergencyStop: (active: boolean) => void;
  /** When defined, E-stop UI mirrors ROS `std_msgs/Bool` (see `VITE_EMERGENCY_STOP_STATE_TOPIC`). */
  emergencyStopRemote?: boolean;
  /** Mode selected in the dashboard (not the internal idle/manual/autonomous placeholder). */
  currentMode: RobotMode;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  rosState,
  cameraConnected,
  onEmergencyStop,
  emergencyStopRemote,
  currentMode,
}) => {
  const { t } = useAppStore();
  const [robotState, setRobotState] = useState<RobotState>({
    connected: rosState.isConnected,
    battery: 0,
    temperature: 0,
    mode: 'idle',
    emergency_stop: false,
  });

  useEffect(() => {
    setRobotState((prev) => ({
      ...prev,
      connected: rosState.isConnected,
    }));
  }, [rosState.isConnected]);

  useEffect(() => {
    if (emergencyStopRemote !== undefined) {
      setRobotState((prev) => ({ ...prev, emergency_stop: emergencyStopRemote }));
    }
  }, [emergencyStopRemote]);

  const estopActive =
    emergencyStopRemote !== undefined ? emergencyStopRemote : robotState.emergency_stop;

  // TODO: wire these from ROS topics once available.
  const telemetryAvailable = false;

  const axelBlue = 'rgba(11, 73, 101, 0.45)'; // #0B4965
  const axelTurquoise = 'rgba(57, 184, 164, 0.45)'; // #39B8A4

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: 'var(--axel-bg)' }}>
      <div className="mb-8">
        <h1 className="text-4xl axel-title axel-gradient-text mb-2">{t('dashboard.title')}</h1>
        <p className="axel-muted text-base">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div
          className="relative overflow-hidden rounded-xl border p-6 transition-all duration-300"
          style={{
            background: rosState.isConnected ? 'rgba(11, 73, 101, 0.12)' : 'rgba(244, 63, 94, 0.08)',
            borderColor: rosState.isConnected ? axelBlue : 'rgba(244, 63, 94, 0.28)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="axel-muted text-sm font-medium">{t('dashboard.rosConnection')}</p>
              <p
                className="text-2xl font-bold mt-2"
                style={{
                  color: rosState.isConnected ? 'rgba(57, 184, 164, 0.95)' : 'rgba(248, 113, 113, 0.95)',
                }}
              >
                {rosState.isConnected ? t('common.connected') : t('common.disconnected')}
              </p>
              <p className="text-xs axel-muted mt-1 truncate">{rosState.rosUrl}</p>
              {!rosState.isConnected && (
                <p className="mt-3 text-xs axel-muted flex items-start gap-2">
                  <InformationCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" aria-hidden />
                  <span>{t('dashboard.reconnectHint')}</span>
                </p>
              )}
            </div>
            <div
              className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: rosState.isConnected ? 'rgba(57, 184, 164, 0.18)' : 'rgba(244, 63, 94, 0.14)',
                color: rosState.isConnected ? 'rgba(57, 184, 164, 0.95)' : 'rgba(248, 113, 113, 0.95)',
              }}
            >
              {rosState.isConnected ? (
                <CheckCircleIcon className="w-8 h-8" aria-hidden />
              ) : (
                <XCircleIcon className="w-8 h-8" aria-hidden />
              )}
            </div>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-xl border p-6 transition-all duration-300"
          style={{
            background: cameraConnected ? 'rgba(57, 184, 164, 0.08)' : 'rgba(244, 63, 94, 0.08)',
            borderColor: cameraConnected ? axelTurquoise : 'rgba(244, 63, 94, 0.28)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="axel-muted text-sm font-medium">{t('dashboard.cameraFeed')}</p>
              <p
                className="text-2xl font-bold mt-2"
                style={{
                  color: cameraConnected ? 'rgba(57, 184, 164, 0.95)' : 'rgba(248, 113, 113, 0.95)',
                }}
              >
                {cameraConnected ? t('common.online') : t('common.offline')}
              </p>
              <p className="text-xs axel-muted mt-1">
                {cameraConnected ? t('dashboard.streamActive') : t('dashboard.noFeed')}
              </p>
            </div>
            <div
              className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: cameraConnected ? 'rgba(57, 184, 164, 0.18)' : 'rgba(244, 63, 94, 0.14)',
                color: cameraConnected ? 'rgba(57, 184, 164, 0.95)' : 'rgba(248, 113, 113, 0.95)',
              }}
            >
              {cameraConnected ? (
                <VideoCameraIcon className="w-8 h-8" aria-hidden />
              ) : (
                <VideoCameraSlashIcon className="w-8 h-8" aria-hidden />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="axel-card p-6">
          <h3 className="text-lg font-bold text-[color:var(--axel-text)] mb-4 flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-5 h-5 shrink-0" style={{ color: 'rgba(57, 184, 164, 0.9)' }} aria-hidden />
            {t('dashboard.systemStatus')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--axel-border)] bg-[var(--axel-surface-soft)]">
              <span className="axel-muted text-sm">{t('dashboard.robotMode')}</span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200">
                {currentMode}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--axel-border)] bg-[var(--axel-surface-soft)]">
              <span className="axel-muted text-sm">{t('dashboard.motorStatus')}</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border border-slate-500/20 bg-slate-500/10 text-[color:var(--axel-text)]">
                {telemetryAvailable ? <CheckCircleIcon className="w-4 h-4" aria-hidden /> : null}
                {telemetryAvailable ? t('dashboard.operational') : t('common.notAvailable')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--axel-border)] bg-[var(--axel-surface-soft)]">
              <span className="axel-muted text-sm">{t('dashboard.allSystems')}</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border border-slate-500/20 bg-slate-500/10 text-[color:var(--axel-text)]">
                {telemetryAvailable ? <CheckCircleIcon className="w-4 h-4" aria-hidden /> : null}
                {telemetryAvailable ? t('dashboard.operational') : t('common.notAvailable')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-6 border border-rose-500/20 bg-rose-500/5">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-[color:var(--axel-text)] mb-1 flex items-center gap-2">
              <StopCircleIcon className="w-5 h-5 text-rose-500 shrink-0" aria-hidden />
              {t('dashboard.emergencyStop')}
            </h3>
            <p className="text-sm axel-muted">{t('dashboard.emergencyStopHint')}</p>
            {emergencyStopRemote !== undefined && (
              <p className="text-xs axel-muted mt-2 flex items-center gap-1.5">
                <InformationCircleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {t('dashboard.stateSynced')}
              </p>
            )}
          </div>
          <EmergencyStopButton
            active={estopActive}
            onToggle={(active) => {
              setRobotState((prev) => ({ ...prev, emergency_stop: active }));
              onEmergencyStop(active);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">15</div>
          <p className="axel-muted text-sm font-medium">{t('dashboard.headServos')}</p>
          <p className="text-xs axel-muted mt-1">{t('dashboard.faceHead')}</p>
        </div>

        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">3</div>
          <p className="axel-muted text-sm font-medium">{t('dashboard.neckServos')}</p>
          <p className="text-xs axel-muted mt-1">{t('dashboard.motors')}</p>
        </div>

        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">20</div>
          <p className="axel-muted text-sm font-medium">{t('dashboard.armServos')}</p>
          <p className="text-xs axel-muted mt-1">{t('dashboard.perHand')}</p>
        </div>

        <div className="axel-card p-6 text-center transition-all">
          <div className="text-4xl font-bold axel-gradient-text mb-2">38</div>
          <p className="axel-muted text-sm font-medium">{t('dashboard.totalServos')}</p>
          <p className="text-xs axel-muted mt-1">{t('dashboard.active')}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
