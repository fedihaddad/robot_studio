import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { parseURDF } from '../../services/urdf.loader';
import { URDFBuilder } from '../../services/urdf.builder';
import { ROSService } from '../../services/ros.service';
import { useAppStore } from '../../store/appStore';

interface RobotViewerProps {
  joints: Record<number, number>;
  isConnected: boolean;
  rosService?: ROSService | null;
  onError?: (error: string) => void;
}

/**
 * 3D Robot Viewer Component - URDF-based Renderer
 * Loads robot from ROS2 URDF and renders with Three.js
 * Updates in real-time as joint angles change
 */
const RobotViewer: React.FC<RobotViewerProps> = ({
  joints,
  isConnected,
  rosService: propsRosService,
  onError,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const urdfBuilderRef = useRef<URDFBuilder | null>(null);
  const rosServiceRef = useRef<ROSService | null>(propsRosService || null);
  const jointMappingsRef = useRef<Map<string, number>>(new Map());
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [debugMode, setDebugMode] = useState(false);
  const [debugStats, setDebugStats] = useState('');
  
  const { config } = useAppStore();

  // Initialize Three.js scene and load URDF
  useEffect(() => {
    if (!mountRef.current) return;

    // Create ROS service if connected and not provided via props
    if (isConnected && !rosServiceRef.current) {
      try {
        rosServiceRef.current = new ROSService(config.rosUrl);
      } catch (err) {
        const errorMessage = `Failed to initialize ROS: ${err instanceof Error ? err.message : String(err)}`;
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
        return;
      }
    }

    let animationFrameId: number;
    const setupScene = async () => {
      try {
        setLoadingMessage('Setting up scene...');

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.Fog(0x1a1a2e, 50, 100);
        sceneRef.current = scene;

        // Camera setup - zoomed out to see entire robot
        const camera = new THREE.PerspectiveCamera(
          75,
          mountRef.current!.clientWidth / mountRef.current!.clientHeight,
          0.01,
          1000
        );
        camera.position.set(1, 0.8, 1.5);
        camera.lookAt(0, 0.5, 0);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.pixelRatio = Math.min(window.devicePixelRatio, 2);
        mountRef.current!.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -5;
        directionalLight.shadow.camera.right = 5;
        directionalLight.shadow.camera.top = 5;
        directionalLight.shadow.camera.bottom = -5;
        directionalLight.shadow.camera.far = 20;
        scene.add(directionalLight);

        // Point light for fill
        const pointLight = new THREE.PointLight(0xffffff, 0.6);
        pointLight.position.set(-1, 0.5, 1);
        scene.add(pointLight);

        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(5, 5);
        const groundMaterial = new THREE.MeshStandardMaterial({
          color: 0x3a3a4e,
          roughness: 0.8,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        scene.add(ground);

        // Load URDF
        let urdfString: string;
        
        if (isConnected && rosServiceRef.current) {
          setLoadingMessage('Loading URDF from ROS2...');
          urdfString = await rosServiceRef.current.loadURDF();
        } else {
          setLoadingMessage('Loading local URDF...');
          const response = await fetch('/data/inmoov-local.urdf');
          if (!response.ok) throw new Error(`Failed to load URDF: ${response.status}`);
          urdfString = await response.text();
        }
        
        setLoadingMessage('Parsing URDF...');
        const urdf = parseURDF(urdfString);

        // Build scene from URDF
        setLoadingMessage('Building 3D scene...');
        const builder = new URDFBuilder(urdf, (msg) => {
          setLoadingMessage(msg);
          console.log(`[URDF Build] ${msg}`);
        });

        const robotScene = await builder.build();
        robotGroupRef.current = robotScene;
        
        // Fix z-up to y-up for InMoov (rotate 90 degrees around X axis)
        robotScene.rotation.x = -Math.PI / 2;
        robotScene.position.y = 0.3; // Lift robot up
        
        scene.add(robotScene);
        urdfBuilderRef.current = builder;

        // Build joint name to servo ID mapping
        const buildJointMapping = () => {
          const mapping = new Map<string, number>();
          
          // Head joints
          const jointMapping: Record<string, number> = {
            'head_roll_joint': 0,
            'head_tilt_joint': 1,
            'head_pan_joint': 2,
            'jaw_joint': 3,
            'eyes_tilt_joint': 4,
            'eyes_pan_joint': 5,
            'l_eye_pan_joint': 6,
            'r_shoulder_out_joint': 7,
            'r_shoulder_lift_joint': 8,
            'r_upper_arm_roll_joint': 9,
            'r_elbow_flex_joint': 10,
            'r_wrist_roll_joint': 11,
            'l_shoulder_out_joint': 12,
            'l_shoulder_lift_joint': 13,
            'l_upper_arm_roll_joint': 14,
            'l_elbow_flex_joint': 15,
            'l_wrist_roll_joint': 16,
          };

          Object.entries(jointMapping).forEach(([jointName, servoId]) => {
            mapping.set(jointName, servoId);
          });

          return mapping;
        };

        jointMappingsRef.current = buildJointMapping();

        // Handle window resize
        const handleResize = () => {
          if (!mountRef.current || !camera || !renderer) return;
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Animation loop
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();

        // Setup mouse controls
        setupControls(renderer, camera, robotScene);

        setIsLoading(false);
        setLoadingMessage('');

        return () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(animationFrameId);
          if (mountRef.current?.contains(renderer.domElement)) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[URDF Viewer] Error:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
      }
    };

    setupScene();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isConnected, config.rosUrl, onError]);

  // Update joint angles from ROS2 joint_states
  useEffect(() => {
    if (!urdfBuilderRef.current || !jointMappingsRef.current) return;

    const builder = urdfBuilderRef.current;
    const jointMappings = jointMappingsRef.current;

    // Update each joint
    jointMappings.forEach((servoId, jointName) => {
      if (joints[servoId] !== undefined) {
        const angleRadians = THREE.MathUtils.degToRad(joints[servoId]);
        builder.updateJoint(jointName, angleRadians);
      }
    });

    if (debugMode) {
      const activeJoints = Array.from(jointMappings.entries())
        .filter(([_, id]) => joints[id] !== undefined)
        .length;
      setDebugStats(`Active joints: ${activeJoints}/${jointMappings.size}`);
    }
  }, [joints, debugMode]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-white text-lg font-semibold">Loading 3D Model...</p>
            <p className="text-gray-400 text-sm mt-2">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="text-center max-w-md bg-gray-800 p-6 rounded">
            <p className="text-red-500 text-lg font-semibold mb-2">⚠️ Error Loading Model</p>
            <p className="text-red-300 text-sm mb-4 break-words">{error}</p>
            <p className="text-gray-400 text-xs">Check browser console for details</p>
          </div>
        </div>
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 z-10">
        <p>🖱️ Drag to rotate | Scroll to zoom | Right-click to pan</p>
      </div>

      {/* Debug Toggle Button */}
      <button
        onClick={() => setDebugMode(!debugMode)}
        className="absolute top-4 right-4 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 z-10"
      >
        {debugMode ? '✓ Debug ON' : '○ Debug OFF'}
      </button>

      {/* Debug Info Panel */}
      {debugMode && (
        <div className="absolute top-14 right-4 bg-gray-800 border border-green-500 rounded p-3 z-10 max-w-xs">
          <h3 className="text-green-400 font-bold mb-2 text-sm">Debug Info</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <p>ROS: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
            <p>Mode: {isConnected ? 'ROS Streaming' : 'Local Model'}</p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            {debugStats && <p>{debugStats}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Setup mouse controls for the camera
 */
function setupControls(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  robotGroup: THREE.Group
) {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  const domElement = renderer.domElement;

  const onMouseDown = (e: MouseEvent) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    // Rotate camera around robot
    const phi = Math.atan2(camera.position.z, camera.position.x);
    const theta = Math.acos(camera.position.y / camera.position.length());
    const radius = camera.position.length();

    const newPhi = phi + deltaX * 0.01;
    const newTheta = Math.max(0.1, Math.min(Math.PI - 0.1, theta + deltaY * 0.01));

    camera.position.x = radius * Math.sin(newTheta) * Math.cos(newPhi);
    camera.position.y = radius * Math.cos(newTheta);
    camera.position.z = radius * Math.sin(newTheta) * Math.sin(newPhi);
    camera.lookAt(0, 0.15, 0);

    previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    isDragging = false;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();

    const direction = camera.position.clone().normalize();
    const currentDist = camera.position.length();
    const newDist = Math.max(0.1, Math.min(3, currentDist + e.deltaY * 0.0002));

    camera.position.copy(direction.multiplyScalar(newDist));
    camera.lookAt(0, 0.15, 0);
  };

  domElement.addEventListener('mousedown', onMouseDown);
  domElement.addEventListener('mousemove', onMouseMove);
  domElement.addEventListener('mouseup', onMouseUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    domElement.removeEventListener('mousedown', onMouseDown);
    domElement.removeEventListener('mousemove', onMouseMove);
    domElement.removeEventListener('mouseup', onMouseUp);
    domElement.removeEventListener('wheel', onWheel);
  };
}

export default RobotViewer;
