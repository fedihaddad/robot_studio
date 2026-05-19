import { useEffect, useState, useRef } from 'react';
import { ROSState } from '../types';
import { DEFAULT_ROSBRIDGE_URL } from '../services/ros-endpoint.service';

declare global {
  interface Window {
    ROSLIB: any;
  }
}

export const useROS = (rosUrl = DEFAULT_ROSBRIDGE_URL) => {
  const [state, setState] = useState<ROSState>({
    isConnected: false,
    rosUrl,
    error: null,
    status: 'disconnected',
    resolvedRosUrl: null,
    lastAttemptedRosUrl: rosUrl,
  });
  
  const rosRef = useRef<any>(null);

  useEffect(() => {
    initializeROS();

    return () => {
      if (rosRef.current) {
        rosRef.current.close();
      }
    };
  }, [rosUrl]);

  const initializeROS = () => {
    try {
      if (!window.ROSLIB) {
        throw new Error('ROSLIB not loaded');
      }

      rosRef.current = new window.ROSLIB.Ros({
        url: rosUrl,
      });

      rosRef.current.on('connection', () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          status: 'connected',
          resolvedRosUrl: rosUrl,
          lastAttemptedRosUrl: rosUrl,
        }));
      });

      rosRef.current.on('error', (error: any) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: error.toString(),
          status: 'connection_lost',
          lastAttemptedRosUrl: rosUrl,
        }));
      });

      rosRef.current.on('close', () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          status: prev.isConnected ? 'connection_lost' : 'disconnected',
        }));
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'disconnected',
      }));
    }
  };

  return { ros: rosRef.current, state };
};
