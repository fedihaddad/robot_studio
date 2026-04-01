/**
 * Time Synchronization Service
 * Synchronizes dashboard clock with robot/ROS time
 * Ensures accurate timestamping of all commands and events
 */

export interface TimeSyncState {
  dashboardTime: number;
  robotTime: number;
  offset: number; // robotTime - dashboardTime
  isSynced: boolean;
  lastSyncTime: number;
  syncStatus: 'synced' | 'syncing' | 'desynchronized';
}

export class TimeSynchronizationService {
  private syncState: TimeSyncState = {
    dashboardTime: Date.now(),
    robotTime: Date.now(),
    offset: 0,
    isSynced: false,
    lastSyncTime: 0,
    syncStatus: 'desynchronized',
  };

  private syncIntervalId: NodeJS.Timeout | null = null;
  private listeners: Array<(state: TimeSyncState) => void> = [];

  /**
   * Initialize time synchronization with robot-provided time
   * @param robotTimeMs - Current time on robot (milliseconds since epoch)
   */
  initializeSync(robotTimeMs: number): void {
    const dashboardNow = Date.now();
    this.syncState.robotTime = robotTimeMs;
    this.syncState.dashboardTime = dashboardNow;
    this.syncState.offset = robotTimeMs - dashboardNow;
    this.syncState.lastSyncTime = dashboardNow;
    this.syncState.isSynced = true;
    this.syncState.syncStatus = 'synced';

    this.notifyListeners();
  }

  /**
   * Update sync with periodic heartbeat from robot
   */
  updateSync(robotTimeMs: number): void {
    const dashboardNow = Date.now();
    const newOffset = robotTimeMs - dashboardNow;

    // Check for clock drift (more than 100ms difference)
    const drift = Math.abs(newOffset - this.syncState.offset);
    if (drift > 100) {
      console.warn(`[TimeSyncService] Clock drift detected: ${drift}ms`);
      this.syncState.syncStatus = 'desynchronized';
    } else {
      this.syncState.syncStatus = 'synced';
    }

    this.syncState.robotTime = robotTimeMs;
    this.syncState.dashboardTime = dashboardNow;
    this.syncState.offset = newOffset;
    this.syncState.lastSyncTime = dashboardNow;

    this.notifyListeners();
  }

  /**
   * Get current synchronized time
   */
  getSynchronizedTime(): number {
    const dashboardNow = Date.now();
    return dashboardNow + this.syncState.offset;
  }

  /**
   * Get time offset (milliseconds)
   */
  getOffset(): number {
    return this.syncState.offset;
  }

  /**
   * Check if system is synchronized
   */
  isSynchronized(): boolean {
    return this.syncState.syncStatus === 'synced';
  }

  /**
   * Get current sync state
   */
  getSyncState(): TimeSyncState {
    return { ...this.syncState };
  }

  /**
   * Subscribe to sync state changes
   */
  onSyncStateChange(listener: (state: TimeSyncState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.syncState }));
  }

  /**
   * Format sync info as string for display
   */
  formatSyncInfo(): string {
    const offsetSign = this.syncState.offset >= 0 ? '+' : '';
    const status = this.syncState.syncStatus.toUpperCase();
    return `${status} (offset: ${offsetSign}${this.syncState.offset}ms)`;
  }

  /**
   * Destroy service
   */
  destroy(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    this.listeners = [];
  }
}

// Global instance
export const timeSyncService = new TimeSynchronizationService();
