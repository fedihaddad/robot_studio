/**
 * Servo Control Hook
 * Connects to ROS2 servo topics for real-time control
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { JOINT_NAME_TO_SERVO_ID, ROSService } from '../services/ros.service';
import { ServoCommand } from '../types';

interface UseServoControlOptions {
  rosService?: ROSService | null;
  enabled?: boolean;
}

interface ServoState {
  id: number;
  angle: number;
  velocity?: number;
  effort?: number;
}

export const useServoControl = (options: UseServoControlOptions = {}) => {
  const { rosService, enabled = true } = options;
  const [servoStates, setServoStates] = useState<Record<number, ServoState>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const rosServiceRef = useRef(rosService);

  useEffect(() => {
    rosServiceRef.current = rosService ?? null;
  }, [rosService]);

  // Keep connection state synchronized even when the ROSService object identity does not change
  useEffect(() => {
    const updateConnectionState = () => {
      const connected = !!rosServiceRef.current?.isConnected();
      setIsConnected((prev) => (prev === connected ? prev : connected));
    };

    updateConnectionState();
    const timer = window.setInterval(updateConnectionState, 500);
    return () => window.clearInterval(timer);
  }, []);

  // Subscribe to servo state updates from ROS2
  useEffect(() => {
    if (!enabled || !isConnected || !rosServiceRef.current) return;

    const unsubscribe = rosServiceRef.current.subscribeToServoState((msg: any) => {
      if (msg.position && msg.name) {
        const newStates: Record<number, ServoState> = {};

        msg.name.forEach((name: string, index: number) => {
          // Primary mapping: explicit InMoov joint name -> unified servo ID
          const mappedId = JOINT_NAME_TO_SERVO_ID[name];
          const servoId =
            mappedId !== undefined
              ? mappedId
              : (() => {
                  // Fallback for legacy names like "servo_12"
                  const match = name.match(/\d+/);
                  return match ? parseInt(match[0], 10) : -1;
                })();

          if (servoId === -1) return;
          const angleRadians = msg.position[index];
          if (!Number.isFinite(angleRadians)) return;

          newStates[servoId] = {
            id: servoId,
            angle: (angleRadians * 180) / Math.PI, // Convert from radians
            velocity: msg.velocity?.[index] || 0,
            effort: msg.effort?.[index] || 0,
          };
        });

        setServoStates(newStates);
        setLastUpdate(Date.now());
      }
    });

    return () => unsubscribe?.();
  }, [enabled, isConnected, rosService]);

  /**
   * Send servo command via ROS2
   */
  const sendCommand = useCallback(
    (servo: ServoCommand) => {
      const connected = rosServiceRef.current?.isConnected();
      
      if (!connected) {
        console.warn('[ServoControl] Cannot send command: ROS not connected', servo);
        return;
      }
      
      try {
        rosServiceRef.current.publishServoCommand(servo);
        console.log('[ServoControl] Sent servo command:', servo);
      } catch (error) {
        console.error('[ServoControl] Error sending servo command:', error, servo);
      }
    },
    []
  );

  /**
   * Send batch commands
   */
  const sendBatchCommand = useCallback(
    (servos: ServoCommand[]) => {
      servos.forEach(servo => sendCommand(servo));
    },
    [sendCommand]
  );

  /**
   * Get head servo IDs (1-17)
   */
  const getHeadServoIds = (): number[] => {
    return Array.from({ length: 17 }, (_, i) => i + 1); // 1..17
  };

  /**
   * Get arm & torso servo IDs (18-39)
   */
  const getArmServoIds = (): number[] => {
    return Array.from({ length: 22 }, (_, i) => 18 + i); // 18..39
  };

  /**
   * Get all servo states
   */
  const getAllServoStates = (): ServoState[] => {
    return Object.values(servoStates);
  };

  /**
   * Get single servo state
   */
  const getServoState = (servoId: number): ServoState | undefined => {
    return servoStates[servoId];
  };

  return {
    servoStates,
    isConnected,
    lastUpdate,
    sendCommand,
    sendBatchCommand,
    getAllServoStates,
    getServoState,
    getHeadServoIds,
    getArmServoIds,
  };
};

export default useServoControl;

