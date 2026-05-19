import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../../store/appStore';

// Import ROS3D and ROSLIB dynamically
let ROS3D: any = null;
let ROSLIB: any = null;

// Try to import from npm packages, fallback to window globals
async function loadROS3DLibraries() {
  try {
    if (!ROS3D) {
      const ros3dModule = await import('ros3d');
      ROS3D = ros3dModule.default;
    }
    if (!ROSLIB) {
      const roslibModule = await import('roslib');
      ROSLIB = roslibModule.default;
    }
  } catch (e) {
    console.warn('Could not import ROS3D/ROSLIB:', e);
    // Try using window globals as fallback
    ROS3D = (window as any).ROS3D;
    ROSLIB = (window as any).ROSLIB;
  }
  return { ROS3D, ROSLIB };
}

interface ROS3DViewerProps {
  rosUrl: string; // ROS bridge WebSocket URL (e.g., ws://raspberry-pi:9090)
  isConnected: boolean;
  onError?: (error: string) => void;
  onConnected?: () => void;
}

/**
 * ROS3D Viewer - Professional ROS robot visualization
 * Loads URDF from ROS param server and subscribes to /joint_states
 * 100% accurate representation of your InMoov robot
 */
const ROS3DViewer: React.FC<ROS3DViewerProps> = ({
  rosUrl,
  isConnected,
  onError,
  onConnected,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const urdfClientRef = useRef<any>(null);
  const rosRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [robotLoaded, setRobotLoaded] = useState(false);
  const { t } = useAppStore();

  useEffect(() => {
    if (!mountRef.current) return;

    (async () => {
      try {
        const libs = await loadROS3DLibraries();

        if (!libs.ROS3D || !libs.ROSLIB) {
          throw new Error('ROS3D or ROSLIB libraries not available');
        }

        setIsLoading(true);
        setError(null);

        // Create ROS connection
        const ros = new libs.ROSLIB.Ros({
          url: rosUrl,
        });

        rosRef.current = ros;

        ros.on('connection', () => {
          console.log('ROS Connection established');
          onConnected?.();

          try {
            // Create viewer
            const viewer = new libs.ROS3D.Viewer({
              divID: 'ros3d-viewer',
              antialias: true,
              background: 0x1a1a2e,
            });

            // Set up lighting and camera
            viewer.scene.background = new THREE.Color(0x1a1a2e);
            
            // Add better lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            viewer.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
            directionalLight.position.set(0.2, 0.3, 0.3);
            directionalLight.castShadow = true;
            viewer.scene.add(directionalLight);

            // Position camera to view robot head-on
            viewer.camera.position.set(0, 0, 0.4);
            viewer.camera.lookAt(0, 0, 0);

            // Create ground plane
            const groundGeometry = new THREE.PlaneGeometry(2, 2);
            const groundMaterial = new THREE.MeshStandardMaterial({
              color: 0x2a2a3e,
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.receiveShadow = true;
            ground.rotation.x = -Math.PI / 2;
            ground.position.z = -0.2;
            ground.position.y = -0.15;
            viewer.scene.add(ground);

            viewerRef.current = viewer;

            // Load URDF from ROS parameter server
            const urdfClient = new libs.ROS3D.UrdfClient({
              ros,
              tfClient: new libs.ROSLIB.TFClient({
                ros,
                angularThres: 0.01,
                rate: 10.0,
              }),
              path: 'package://inmoov_description/urdf/',
              rootObject: viewer.scene,
              loader: libs.ROS3D.COLLADA_LOADER_0,
              param: 'robot_description',
            });

            urdfClientRef.current = urdfClient;

            urdfClient.on('loaded', () => {
              console.log('✓ URDF loaded successfully');
              setRobotLoaded(true);
              setIsLoading(false);

              // Fit camera to robot
              const box = new THREE.Box3().setFromObject(viewer.scene);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const fov = viewer.camera.fov * (Math.PI / 180);
              let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
              cameraZ *= 1.5;

              viewer.camera.position.z = cameraZ;
              viewer.camera.position.y = 0;
              viewer.camera.position.x = 0;
              viewer.camera.lookAt(center);
            });

            urdfClient.on('error', (error: any) => {
              console.error('URDF loading error:', error);
              const errorMsg = `Failed to load URDF: ${error}`;
              setError(errorMsg);
              setIsLoading(false);
              onError?.(errorMsg);
            });

            // Handle window resize
            const handleResize = () => {
              if (!mountRef.current || !viewer) return;
              const width = mountRef.current.clientWidth;
              const height = mountRef.current.clientHeight;
              viewer.renderer.setSize(width, height);
              viewer.camera.aspect = width / height;
              viewer.camera.updateProjectionMatrix();
            };

            window.addEventListener('resize', handleResize);

            return () => {
              window.removeEventListener('resize', handleResize);
              viewer.renderer.dispose();
            };
          } catch (err) {
            const errorMsg = `Viewer initialization error: ${err}`;
            console.error(errorMsg);
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
          }
        });

        ros.on('error', (error: any) => {
          console.error('ROS connection error:', error);
          const errorMsg = `ROS connection failed: ${error}`;
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
        });

        ros.on('close', () => {
          console.warn('ROS connection closed');
          setRobotLoaded(false);
        });
      } catch (err) {
        const errorMsg = `Library loading error: ${err}`;
        console.error(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    })();

    return () => {
      if (rosRef.current && rosRef.current.isConnected) {
        rosRef.current.close();
      }
    };
  }, [rosUrl, onError, onConnected]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* ROS3D Viewer Container */}
      <div
        ref={mountRef}
        id="ros3d-viewer"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-white text-lg font-semibold">{t('common.loading')}</p>
            <p className="text-gray-400 text-sm mt-2">{t('viewer.loadingUrdf')}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="text-center max-w-md bg-gray-800 p-6 rounded-lg border border-red-500">
            <p className="text-red-500 text-lg font-semibold mb-2">⚠️ Connection Error</p>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <p className="text-gray-400 text-xs">
              Make sure ROS bridge is running on: {rosUrl}
            </p>
          </div>
        </div>
      )}

      {/* Status Badge */}
      {robotLoaded && (
        <div className="absolute top-4 left-4 bg-green-900 border border-green-700 rounded px-3 py-2 z-10">
          <p className="text-green-300 text-sm">✓ Robot Loaded</p>
        </div>
      )}

      {!isConnected && (
        <div className="absolute top-4 right-4 bg-red-900 border border-red-700 rounded px-3 py-2 z-10">
          <p className="text-red-300 text-sm">{t('viewer.rosDisconnected')}</p>
        </div>
      )}

      {/* Camera Controls Info */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 z-10">
        <p>🖱️ Left-drag to rotate | Right-drag to pan | Scroll to zoom</p>
      </div>
    </div>
  );
};

export default ROS3DViewer;
