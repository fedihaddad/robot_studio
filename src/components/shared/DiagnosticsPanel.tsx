import React, { useMemo, useState } from 'react';
import { ROSService } from '../../services/ros.service';
import { ROSState, RobotMode } from '../../types';

type DiagnosticsPanelProps = {
  rosState: ROSState;
  rosService: ROSService | null;
  currentMode: RobotMode;
  aiNodeActive: boolean;
};

const formatAge = (ts?: number) => {
  if (!ts) return '—';
  const deltaMs = Date.now() - ts;
  if (deltaMs < 0) return '0s';
  const s = Math.floor(deltaMs / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const getCachedTopicTs = (rosService: ROSService | null, topic: string): number | undefined => {
  const cached = rosService?.getTopicCache(topic);
  return cached?.timestamp;
};

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ rosState, rosService, currentMode, aiNodeActive }) => {
  const [copied, setCopied] = useState(false);

  const snapshots = useMemo(() => {
    const jointTs = getCachedTopicTs(rosService, '/joint_states');
    const heartbeatTs = getCachedTopicTs(rosService, '/axel/heartbeat');
    const servoCmdTs = getCachedTopicTs(rosService, '/servo/cmd');
    const cmdVelTs = getCachedTopicTs(rosService, '/cmd_vel');
    const robotStateTs = getCachedTopicTs(rosService, '/robot/state');
    const cacheSize = rosService ? Array.from(rosService.getAllTopicsCache().keys()).length : 0;
    return { jointTs, heartbeatTs, servoCmdTs, cmdVelTs, robotStateTs, cacheSize };
  }, [rosService]);

  const exportDiagnostics = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      ros: rosState,
      currentMode,
      aiNodeActive,
      topicTimestamps: {
        '/joint_states': snapshots.jointTs ?? null,
        '/axel/heartbeat': snapshots.heartbeatTs ?? null,
        '/servo/cmd': snapshots.servoCmdTs ?? null,
        '/cmd_vel': snapshots.cmdVelTs ?? null,
        '/robot/state': snapshots.robotStateTs ?? null,
      },
      // Best-effort: export the last cached messages for quick debugging.
      cachedMessages: {
        '/joint_states': rosService?.getTopicCache('/joint_states')?.message ?? null,
        '/axel/heartbeat': rosService?.getTopicCache('/axel/heartbeat')?.message ?? null,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axel-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    const text = [
      `ROS: ${rosState.status || (rosState.isConnected ? 'connected' : 'disconnected')} (${rosState.rosUrl})`,
      rosState.error ? `ROS error: ${rosState.error}` : null,
      rosState.resolvedRosUrl ? `Resolved endpoint: ${rosState.resolvedRosUrl}` : null,
      `AI node: ${aiNodeActive ? 'active' : 'standby'}`,
      `Mode: ${currentMode}`,
      `/joint_states age: ${formatAge(snapshots.jointTs)}`,
      `/axel/heartbeat age: ${formatAge(snapshots.heartbeatTs)}`,
      `topic cache size: ${snapshots.cacheSize}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
    <div className="axel-card p-4">
      <p className="text-[10px] uppercase tracking-widest axel-muted">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs axel-muted break-words">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={copySummary} className="axel-button-secondary px-4 py-2 rounded-xl text-sm font-bold">
          {copied ? 'Copied' : 'Copy summary'}
        </button>
        <button onClick={exportDiagnostics} className="axel-button-primary px-4 py-2 rounded-xl text-sm font-bold">
          Export diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat
          label="ROS"
          value={rosState.status ? rosState.status.replace('_', ' ') : (rosState.isConnected ? 'Connected' : 'Disconnected')}
          hint={rosState.error ? `Error: ${rosState.error}` : (rosState.resolvedRosUrl || rosState.rosUrl)}
        />
        <Stat label="AI Node" value={aiNodeActive ? 'Active' : 'Standby'} hint="/axel/heartbeat" />
        <Stat label="Mode" value={currentMode} hint="Live Axel" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Stat label="/joint_states age" value={formatAge(snapshots.jointTs)} />
        <Stat label="/axel/heartbeat age" value={formatAge(snapshots.heartbeatTs)} />
        <Stat label="Topic cache size" value={`${snapshots.cacheSize}`} hint="cached RX messages" />
        <Stat label="Last /servo/cmd age" value={formatAge(snapshots.servoCmdTs)} />
      </div>
    </div>
  );
};

export default DiagnosticsPanel;

