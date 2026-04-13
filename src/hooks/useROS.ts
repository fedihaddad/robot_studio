import { useEffect, useState, useRef } from 'react';
import { ROSState } from '../types';

declare global {
  interface Window {
    ROSLIB: any;
  }
}

export const useROS = (rosUrl = 'ws://localhost:9090') => {
  const [state, setState] = useState<ROSState>({
    isConnected: false,
    rosUrl,
    error: null,
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
        }));
      });

      rosRef.current.on('error', (error: any) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: error.toString(),
        }));
      });

      rosRef.current.on('close', () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
        }));
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  return { ros: rosRef.current, state };
};
