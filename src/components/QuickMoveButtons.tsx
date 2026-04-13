/**
 * Quick Move Buttons Component
 * Test buttons for moving the robot quickly
 * Supports both ROS-connected and offline simulation modes
 */

import React from 'react';
import { useAppStore } from '../store/appStore';

export const QuickMoveButtons: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState('Ready');
  const [isOfflineMode, setIsOfflineMode] = React.useState(true);
  const { updateJointStates } = useAppStore();

  const handleMove = async (action: string) => {
    setLoading(true);
    setStatus('Moving...');
    
    try {
      // Try to use ROS if available
      const ros = (window as any).rosService;
      const useROS = ros && ros.isConnected?.();

      if (useROS) {
        setIsOfflineMode(false);
        // Use ROS to move the real robot
        switch (action) {
          case 'right_shoulder':
            console.log('📍 Moving right shoulder (ROS)...');
            await ros.moveJoint('r_shoulder_out_joint', 0.5, 2.0);
            setStatus('✅ Right shoulder moved!');
            break;

          case 'right_arm':
            console.log('💪 Moving right arm (ROS)...');
            await ros.moveGroup('right_arm', [0.5, 1.2, 0.3, -1.5, 0], 3.0);
            setStatus('✅ Right arm moved!');
            break;

          case 'left_arm':
            console.log('💪 Moving left arm (ROS)...');
            await ros.moveGroup('left_arm', [-0.5, 1.2, -0.3, -1.5, 0], 3.0);
            setStatus('✅ Left arm moved!');
            break;

          case 'grasp':
            console.log('✊ Moving to grasp position (ROS)...');
            await ros.moveToPreset('grasp');
            setStatus('✅ Grasp position!');
            break;

          case 'home':
            console.log('🏠 Moving to home position (ROS)...');
            await ros.moveToPreset('home');
            setStatus('✅ Home position!');
            break;

          case 'rest':
            console.log('😴 Moving to rest position (ROS)...');
            await ros.moveToPreset('rest');
            setStatus('✅ Rest position!');
            break;

          case 'wave':
            console.log('👋 Waving (ROS)...');
            for (let i = 0; i < 3; i++) {
              await ros.moveGroup('right_arm', [0.5, 1.0, 0, -1.0, 0.5], 0.5);
              await ros.moveGroup('right_arm', [0.5, 1.0, 0, -1.0, -0.5], 0.5);
            }
            setStatus('✅ Wave complete!');
            break;

          case 'head_look_up':
            console.log('🗣️ Looking up (ROS)...');
            await ros.moveJoint('head_tilt_joint', -0.3, 1.0);
            setStatus('✅ Looking up!');
            break;

          case 'head_look_down':
            console.log('🗣️ Looking down (ROS)...');
            await ros.moveJoint('head_tilt_joint', 0.3, 1.0);
            setStatus('✅ Looking down!');
            break;

          case 'jaw_open':
            console.log('😲 Opening jaw (ROS)...');
            await ros.moveJoint('jaw_joint', 0.5, 1.0);
            setStatus('✅ Jaw open!');
            break;

          case 'smile':
            console.log('😊 Smiling (ROS)...');
            await ros.moveMultiple([
              { joint: 'eyes_pan_joint', angle: 0 },
              { joint: 'l_eye_pan_joint', angle: 0 },
            ], 1.0);
            setStatus('✅ Smiling!');
            break;

          default:
            setStatus('❓ Unknown action');
        }
      } else {
        // Offline simulation mode - update local joint states
        setIsOfflineMode(true);
        console.log('📺 Offline Mode - Simulating movement...');

        switch (action) {
          case 'right_shoulder':
            console.log('📍 Simulating right shoulder movement...');
            updateJointStates({ 'r_shoulder_out_joint': 0.5 });
            setStatus('✅ Right shoulder (offline)');
            break;

          case 'right_arm':
            console.log('💪 Simulating right arm movement...');
            updateJointStates({
              'r_shoulder_out_joint': 0.5,
              'r_shoulder_lift_joint': 1.2,
              'r_upper_arm_roll_joint': 0.3,
              'r_elbow_flex_joint': -1.5,
              'r_wrist_roll_joint': 0,
            });
            setStatus('✅ Right arm (offline)');
            break;

          case 'left_arm':
            console.log('💪 Simulating left arm movement...');
            updateJointStates({
              'l_shoulder_out_joint': -0.5,
              'l_shoulder_lift_joint': 1.2,
              'l_upper_arm_roll_joint': -0.3,
              'l_elbow_flex_joint': -1.5,
              'l_wrist_roll_joint': 0,
            });
            setStatus('✅ Left arm (offline)');
            break;

          case 'grasp':
            console.log('✊ Simulating grasp position...');
            updateJointStates({
              'r_thumb1_joint': 0.5,
              'r_index1_joint': 0.8,
              'r_middle1_joint': 0.8,
              'r_ring1_joint': 0.8,
              'r_pinky1_joint': 0.8,
            });
            setStatus('✅ Grasp (offline)');
            break;

          case 'home':
            console.log('🏠 Simulating home position...');
            updateJointStates({
              'r_shoulder_out_joint': 0,
              'r_shoulder_lift_joint': 0,
              'r_upper_arm_roll_joint': 0,
              'r_elbow_flex_joint': 0,
              'r_wrist_roll_joint': 0,
              'l_shoulder_out_joint': 0,
              'l_shoulder_lift_joint': 0,
              'l_upper_arm_roll_joint': 0,
              'l_elbow_flex_joint': 0,
              'l_wrist_roll_joint': 0,
              'head_tilt_joint': 0,
              'head_pan_joint': 0,
              'jaw_joint': 0,
            });
            setStatus('✅ Home (offline)');
            break;

          case 'rest':
            console.log('😴 Simulating rest position...');
            updateJointStates({
              'r_shoulder_lift_joint': 1.5,
              'r_elbow_flex_joint': -1.5,
              'l_shoulder_lift_joint': 1.5,
              'l_elbow_flex_joint': -1.5,
            });
            setStatus('✅ Rest (offline)');
            break;

          case 'wave':
            console.log('👋 Simulating wave...');
            updateJointStates({
              'r_shoulder_out_joint': 0.5,
              'r_shoulder_lift_joint': 1.0,
              'r_wrist_roll_joint': 0.5,
            });
            setStatus('✅ Wave (offline)');
            break;

          case 'head_look_up':
            console.log('🗣️ Simulating look up...');
            updateJointStates({ 'head_tilt_joint': -0.5 });
            setStatus('✅ Looking up (offline)');
            break;

          case 'head_look_down':
            console.log('🗣️ Simulating look down...');
            updateJointStates({ 'head_tilt_joint': 0.5 });
            setStatus('✅ Looking down (offline)');
            break;

          case 'jaw_open':
            console.log('😲 Simulating jaw open...');
            updateJointStates({ 'jaw_joint': 0.8 });
            setStatus('✅ Jaw open (offline)');
            break;

          case 'smile':
            console.log('😊 Simulating smile...');
            updateJointStates({
              'eyes_pan_joint': 0,
              'l_eye_pan_joint': 0,
            });
            setStatus('✅ Smiling (offline)');
            break;

          default:
            setStatus('❓ Unknown action');
        }
      }

      // Reset status after 3 seconds
      setTimeout(() => setStatus('Ready'), 3000);
    } catch (error) {
      console.error('❌ Error:', error);
      setStatus(`❌ Error: ${(error as any).message || 'Unknown error'}`);
      setTimeout(() => setStatus('Ready'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg shadow-xl border border-blue-900">
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-4">🎮 Quick Move Buttons</h2>

      {/* Status */}
      <div className="mb-4 p-2 bg-gray-800 rounded border border-gray-700">
        <p className="text-sm text-gray-300">
          Status: <span className="font-semibold text-blue-400">{status}</span>
        </p>
      </div>

      {/* Arm Movements */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">💪 Arm Movements</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleMove('right_shoulder')}
            disabled={loading}
            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Right Shoulder
          </button>

          <button
            onClick={() => handleMove('right_arm')}
            disabled={loading}
            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Right Arm
          </button>

          <button
            onClick={() => handleMove('left_arm')}
            disabled={loading}
            className="py-2 px-3 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Left Arm
          </button>

          <button
            onClick={() => handleMove('wave')}
            disabled={loading}
            className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            👋 Wave
          </button>
        </div>
      </div>

      {/* Poses */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">🧘 Preset Poses</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleMove('home')}
            disabled={loading}
            className="py-2 px-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🏠 Home
          </button>

          <button
            onClick={() => handleMove('grasp')}
            disabled={loading}
            className="py-2 px-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✊ Grasp
          </button>

          <button
            onClick={() => handleMove('rest')}
            disabled={loading}
            className="py-2 px-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            😴 Rest
          </button>
        </div>
      </div>

      {/* Head Movements */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">🗣️ Head Movements</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleMove('head_look_up')}
            disabled={loading}
            className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Look Up ⬆️
          </button>

          <button
            onClick={() => handleMove('head_look_down')}
            disabled={loading}
            className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Look Down ⬇️
          </button>
        </div>
      </div>

      {/* Face Expressions */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">😊 Face Expressions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleMove('jaw_open')}
            disabled={loading}
            className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            😲 Open Mouth
          </button>

          <button
            onClick={() => handleMove('smile')}
            disabled={loading}
            className="py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            😊 Smile
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
        <p className="text-xs text-blue-300">
          💡 <strong>Tip:</strong> Click buttons to test robot movements. Watch the 3D viewer!
        </p>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
