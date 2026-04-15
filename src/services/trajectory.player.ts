/**
 * Trajectory Player Service
 * Stores, plays back, and visualizes robot motion trajectories
 * Supports real-time playback with time controls
 */

export interface TrajectoryPoint {
  time: number; // seconds
  jointPositions: Record<string, number>; // radians
}

export interface Trajectory {
  id: string;
  name: string;
  description: string;
  jointNames: string[];
  points: TrajectoryPoint[];
  duration: number; // total duration in seconds
  createdAt: number; // timestamp
}

export enum PlaybackState {
  STOPPED = 'STOPPED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

export type PlaybackCallback = (
  state: PlaybackState,
  currentTime: number,
  jointPositions: Record<string, number>
) => void;

export class TrajectoryPlayer {
  private trajectories: Map<string, Trajectory> = new Map();
  private currentTrajectory: Trajectory | null = null;
  private playbackState: PlaybackState = PlaybackState.STOPPED;
  private currentTime: number = 0;
  private playbackRate: number = 1.0;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private callbacks: Set<PlaybackCallback> = new Set();

  /**
   * Store a new trajectory
   */
  addTrajectory(trajectory: Trajectory): void {
    this.trajectories.set(trajectory.id, trajectory);
  }

  /**
   * Load trajectories from JSON
   */
  loadFromJSON(json: string): Trajectory[] {
    try {
      const trajectories = JSON.parse(json) as Trajectory[];
      trajectories.forEach(t => this.addTrajectory(t));
      return trajectories;
    } catch (error) {
      console.error('Failed to load trajectories from JSON:', error);
      return [];
    }
  }

  /**
   * Export trajectories to JSON
   */
  exportToJSON(): string {
    const trajArray = Array.from(this.trajectories.values());
    return JSON.stringify(trajArray, null, 2);
  }

  /**
   * Get trajectory by ID
   */
  getTrajectory(id: string): Trajectory | undefined {
    return this.trajectories.get(id);
  }

  /**
   * Get all trajectories
   */
  getAllTrajectories(): Trajectory[] {
    return Array.from(this.trajectories.values());
  }

  /**
   * Play trajectory
   */
  play(trajectoryId: string): void {
    const trajectory = this.trajectories.get(trajectoryId);
    if (!trajectory) {
      console.error(`Trajectory ${trajectoryId} not found`);
      return;
    }

    this.currentTrajectory = trajectory;
    this.playbackState = PlaybackState.PLAYING;
    this.currentTime = 0;
    this.lastFrameTime = performance.now();
    this.startPlayback();
    this.notifyCallbacks();
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (this.playbackState === PlaybackState.PAUSED && this.currentTrajectory) {
      this.playbackState = PlaybackState.PLAYING;
      this.lastFrameTime = performance.now();
      this.startPlayback();
      this.notifyCallbacks();
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.playbackState = PlaybackState.PAUSED;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.notifyCallbacks();
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.playbackState = PlaybackState.STOPPED;
    this.currentTime = 0;
    this.currentTrajectory = null;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.notifyCallbacks();
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (this.currentTrajectory) {
      this.currentTime = Math.max(0, Math.min(time, this.currentTrajectory.duration));
      this.notifyCallbacks();
    }
  }

  /**
   * Set playback rate (1.0 = normal speed, 2.0 = 2x, 0.5 = half speed)
   */
  setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.1, Math.min(4.0, rate));
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Get current trajectory
   */
  getCurrentTrajectory(): Trajectory | null {
    return this.currentTrajectory;
  }

  /**
   * Get interpolated joint positions at current time
   */
  getJointPositionsAtTime(time: number): Record<string, number> {
    if (!this.currentTrajectory || this.currentTrajectory.points.length === 0) {
      return {};
    }

    // Clamp time
    time = Math.max(0, Math.min(time, this.currentTrajectory.duration));

    const points = this.currentTrajectory.points;

    // Find surrounding points
    let idx1 = 0;
    let idx2 = 0;

    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].time <= time && time <= points[i + 1].time) {
        idx1 = i;
        idx2 = i + 1;
        break;
      }
    }

    if (idx1 === idx2) {
      return points[idx1].jointPositions;
    }

    // Linear interpolation
    const p1 = points[idx1];
    const p2 = points[idx2];
    const t =
      (time - p1.time) / (p2.time - p1.time + 0.0001); // Avoid division by zero

    const result: Record<string, number> = {};

    for (const jointName of this.currentTrajectory.jointNames) {
      const pos1 = p1.jointPositions[jointName] || 0;
      const pos2 = p2.jointPositions[jointName] || 0;
      result[jointName] = pos1 + (pos2 - pos1) * t;
    }

    return result;
  }

  /**
   * Register callback for playback events
   */
  subscribe(callback: PlaybackCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Delete trajectory
   */
  deleteTrajectory(id: string): void {
    if (this.currentTrajectory?.id === id) {
      this.stop();
    }
    this.trajectories.delete(id);
  }

  /**
   * Clear all trajectories
   */
  clear(): void {
    this.stop();
    this.trajectories.clear();
  }

  /**
   * Start animation loop
   */
  private startPlayback(): void {
    const animate = () => {
      if (this.playbackState !== PlaybackState.PLAYING || !this.currentTrajectory) {
        return;
      }

      const now = performance.now();
      const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
      this.lastFrameTime = now;

      // Update current time based on playback rate
      this.currentTime += deltaTime * this.playbackRate;

      // Check if trajectory finished
      if (this.currentTime >= this.currentTrajectory.duration) {
        this.currentTime = this.currentTrajectory.duration;
        this.playbackState = PlaybackState.STOPPED;
        this.notifyCallbacks();
        return;
      }

      this.notifyCallbacks();
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Notify all callbacks of playback update
   */
  private notifyCallbacks(): void {
    const positions = this.getJointPositionsAtTime(this.currentTime);
    this.callbacks.forEach(callback => {
      callback(this.playbackState, this.currentTime, positions);
    });
  }
}

export const trajectoryPlayer = new TrajectoryPlayer();
