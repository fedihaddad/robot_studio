import React, { useState, useEffect } from 'react';
import { TimeSyncState } from '../../types';
import { timeSyncService } from '../../services/timeSynchronization.service';

interface TimeSyncIndicatorProps {
  refreshInterval?: number; // ms between updates
  showDetails?: boolean;
}

const TimeSyncIndicator: React.FC<TimeSyncIndicatorProps> = ({
  refreshInterval = 1000,
  showDetails = false,
}) => {
  const [syncState, setSyncState] = useState<TimeSyncState>(timeSyncService.getSyncState());
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    // Update sync state
    const unsubscribe = timeSyncService.onSyncStateChange((newState: TimeSyncState) => {
      setSyncState(newState);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Update local time display
    const interval = setInterval(() => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = () => {
    switch (syncState.syncStatus) {
      case 'synced':
        return 'bg-green-900/30 border-green-700 text-green-400';
      case 'syncing':
        return 'bg-yellow-900/30 border-yellow-700 text-yellow-400';
      case 'desynchronized':
        return 'bg-red-900/30 border-red-700 text-red-400';
      default:
        return 'bg-gray-900/30 border-gray-700 text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (syncState.syncStatus) {
      case 'synced':
        return '✓';
      case 'syncing':
        return '⟳';
      case 'desynchronized':
        return '✗';
      default:
        return '?';
    }
  };

  if (!showDetails) {
    // Compact indicator
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border ${getStatusColor()}`}>
        <span className="text-sm font-semibold">{getStatusIcon()}</span>
        <span className="text-xs font-medium">{syncState.syncStatus.toUpperCase()}</span>
      </div>
    );
  }

  // Detailed view
  return (
    <div className={`rounded-lg p-4 border ${getStatusColor()}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-lg">{getStatusIcon()}</span>
            Time Synchronization
          </h3>
          <div className="text-sm space-y-1">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="ml-2 font-semibold uppercase">{syncState.syncStatus}</span>
            </div>
            <div>
              <span className="text-gray-400">Local Time:</span>
              <span className="ml-2 font-mono">{localTime}</span>
            </div>
            <div>
              <span className="text-gray-400">Time Offset:</span>
              <span className="ml-2 font-mono">
                {syncState.offset >= 0 ? '+' : ''}{syncState.offset}ms
              </span>
            </div>
            <div>
              <span className="text-gray-400">Last Sync:</span>
              <span className="ml-2 font-mono">
                {new Date(syncState.lastSyncTime).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicator Dot */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full ${
              syncState.syncStatus === 'synced'
                ? 'bg-green-500 animate-pulse'
                : syncState.syncStatus === 'syncing'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-400">
            {syncState.syncStatus === 'synced' ? 'Locked' : syncState.syncStatus === 'syncing' ? 'Syncing' : 'Drift'}
          </span>
        </div>
      </div>

      {/* Warning if desynchronized */}
      {syncState.syncStatus === 'desynchronized' && (
        <div className="mt-3 pt-3 border-t border-red-700/50 text-xs">
          <p>⚠ System is desynchronized. Commands may have timing issues.</p>
        </div>
      )}

      {/* Info if offset is significant */}
      {Math.abs(syncState.offset) > 50 && syncState.syncStatus === 'synced' && (
        <div className="mt-3 pt-3 border-t border-yellow-700/50 text-xs">
          <p>ℹ Significant time offset detected. Adjust robot clock if needed.</p>
        </div>
      )}
    </div>
  );
};

export default TimeSyncIndicator;
