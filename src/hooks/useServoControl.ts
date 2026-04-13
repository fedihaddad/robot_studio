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

  // Subscribe to servo state updates from ROS2
  useEffect(() => {
    if (!enabled || !rosServiceRef.current?.isConnected()) return;

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

          newStates[servoId] = {
            id: servoId,
            angle: (msg.position[index] * 180) / Math.PI, // Convert from radians
            velocity: msg.velocity?.[index] || 0,
            effort: msg.effort?.[index] || 0,
          };
        });

        setServoStates(newStates);
        setLastUpdate(Date.now());
      }
    });

    setIsConnected(true);
    return () => unsubscribe?.();
  }, [enabled, rosServiceRef.current?.isConnected()]);

  /**
   * Send servo command via ROS2
   */
  const sendCommand = useCallback(
    (servo: ServoCommand) => {
      if (!rosServiceRef.current?.isConnected()) {
        console.warn('ROS not connected');
        return;
      }
      rosServiceRef.current.publishServoCommand(servo);
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
   * Get head servo IDs (1-15)
   */
  const getHeadServoIds = (): number[] => {
    // 0..16 + eye/iris visual chain 53..56
    return [...Array.from({ length: 17 }, (_, i) => i), 53, 54, 55, 56];
  };

  /**
   * Get arm servo IDs (16-25)
   */
  const getArmServoIds = (): number[] => {
    // Arms + fingers + waist
    return Array.from({ length: 36 }, (_, i) => 17 + i); // 17..52
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

