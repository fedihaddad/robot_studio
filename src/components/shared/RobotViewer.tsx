import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { parseURDF } from '../../services/urdf.loader';
import { URDFBuilder } from '../../services/urdf.builder';
import { JOINT_NAME_TO_SERVO_ID, ROSService } from '../../services/ros.service';
import { useAppStore } from '../../store/appStore';
import { ServoCommand } from '../../types';
import { ModelService } from '../../services/model.service';

interface RobotViewerProps {
  joints: Record<number, number>;
  jointStatesByName?: Record<string, number>;
  isConnected: boolean;
  rosService?: ROSService | null;
  onError?: (error: string) => void;
  showFitButton?: boolean;
  showLoadingOverlay?: boolean;
  showLoadingDetails?: boolean;
  showControlsHint?: boolean;
  isIntroMode?: boolean;
  onModelReady?: () => void;
  onServoCommand?: (command: ServoCommand) => void;
}

let cachedLocalURDF: string | null = null;
const LOCAL_URDF_URL = new URL('../../data/inmoov-local.urdf', import.meta.url).toString();

/**
 * 3D Robot Viewer Component - URDF-based Renderer
 * Loads robot from ROS2 URDF and renders with Three.js
 * Updates in real-time as joint angles change
 */
const RobotViewer: React.FC<RobotViewerProps> = ({
  joints,
  jointStatesByName = {},
  isConnected,
  rosService: propsRosService,
  onError,
  showFitButton = true,
  showLoadingOverlay = true,
  showLoadingDetails = true,
  showControlsHint = true,
  isIntroMode = false,
  onModelReady,
  onServoCommand,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const urdfBuilderRef = useRef<URDFBuilder | null>(null);
  const rosServiceRef = useRef<ROSService | null>(propsRosService || null);
  const jointMappingsRef = useRef<Map<string, number>>(new Map());
  const orbitTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.15, 0));
  const initialAutoFitDoneRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  const latestJointsRef = useRef<Record<number, number>>({});
  const latestNamedJointsRef = useRef<Record<string, number>>({});
  const handHandlesRef = useRef<{ left?: THREE.Mesh; right?: THREE.Mesh }>({});
  const isDraggingHandleRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [debugMode, setDebugMode] = useState(false);
  const [debugStats, setDebugStats] = useState('');

  const { config } = useAppStore();

  useEffect(() => {
    rosServiceRef.current = propsRosService || rosServiceRef.current;
  }, [propsRosService]);

  // Initialize Three.js scene and load URDF
  useEffect(() => {
    if (!mountRef.current) return;
    initialAutoFitDoneRef.current = false;
    hasUserInteractedRef.current = false;

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
    const cleanupFns: Array<() => void> = [];
    const setupScene = async () => {
      try {
        setLoadingMessage('Setting up scene...');

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.Fog(0x1a1a2e, 50, 100);
        sceneRef.current = scene;

        // Camera setup - zoomed out to see entire robot
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
        renderer.shadowMap.enabled = !isIntroMode;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.pixelRatio = isIntroMode ? 1 : Math.min(window.devicePixelRatio, 2);
        mountRef.current!.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = !isIntroMode;
        if (!isIntroMode) {
          directionalLight.shadow.mapSize.width = 2048;
          directionalLight.shadow.mapSize.height = 2048;
          directionalLight.shadow.camera.left = -5;
          directionalLight.shadow.camera.right = 5;
          directionalLight.shadow.camera.top = 5;
          directionalLight.shadow.camera.bottom = -5;
          directionalLight.shadow.camera.far = 20;
        }
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

        // Load URDF & Build scene
        const modelService = ModelService.getInstance();
        let robotScene: THREE.Group;
        let builder: URDFBuilder;

        if (modelService.isModelReady()) {
          setLoadingMessage('Using preloaded model...');
          builder = modelService.getBuilder()!;
          robotScene = modelService.getRobotScene()!;
          scene.add(robotScene);
        } else {
          setLoadingMessage('Loading URDF...');
          let urdfString: string;
          const loadLocalURDF = async (): Promise<string> => {
            if (cachedLocalURDF) {
              return cachedLocalURDF;
            }
            setLoadingMessage('Loading local URDF...');
            const urdfCandidates = [
              LOCAL_URDF_URL,
              new URL('../data/inmoov-local.urdf', window.location.href).toString(),
              new URL('./data/inmoov-local.urdf', window.location.href).toString(),
              '/data/inmoov-local.urdf',
            ];

            for (const candidate of urdfCandidates) {
              try {
                const response = await fetch(candidate);
                if (!response.ok) continue;
                cachedLocalURDF = await response.text();
                return cachedLocalURDF;
              } catch {
                // Try the next candidate.
              }
            }

            throw new Error('Failed to load local URDF from packaged paths');
          };

          if (isConnected && rosServiceRef.current) {
            setLoadingMessage('Loading URDF from ROS2 /robot_description topic...');
            try {
              urdfString = await rosServiceRef.current.loadURDF();
            } catch (rosError) {
              setLoadingMessage('ROS2 URDF failed, loading local fallback...');
              urdfString = await loadLocalURDF();
            }
          } else {
            setLoadingMessage('Loading local URDF (offline mode)...');
            urdfString = await loadLocalURDF();
          }

          setLoadingMessage('Parsing URDF...');
          const urdf = parseURDF(urdfString);

          // Build scene from URDF
          setLoadingMessage('Building 3D scene...');
          builder = new URDFBuilder(urdf, (msg) => {
            setLoadingMessage(msg);
          });

          robotScene = await builder.build();
          robotScene.rotation.x = -Math.PI / 2;
          robotScene.position.y = 0.3;
          scene.add(robotScene);
        }

        robotGroupRef.current = robotScene;
        urdfBuilderRef.current = builder;

        console.log('[RobotViewer] Robot added to scene at position:', robotScene.position);
        fitCameraToRobot(camera, robotScene, orbitTargetRef.current, 1.5);
        createOrUpdateHandHandles(scene, robotScene, handHandlesRef.current);

        // Build joint name to servo ID mapping
        const buildJointMapping = () =>
          new Map<string, number>(Object.entries(JOINT_NAME_TO_SERVO_ID));

        jointMappingsRef.current = buildJointMapping();

        // Handle window resize
        const handleResize = () => {
          if (!mountRef.current || !camera || !renderer) return;
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);

          if (!hasUserInteractedRef.current && robotGroupRef.current) {
            fitCameraToRobot(camera, robotGroupRef.current, orbitTargetRef.current, 1.5);
          }
        };
        window.addEventListener('resize', handleResize);
        cleanupFns.push(() => window.removeEventListener('resize', handleResize));

        // Layout changes inside app (without window resize) can affect first framing.
        if (typeof ResizeObserver !== 'undefined' && mountRef.current) {
          const resizeObserver = new ResizeObserver(() => {
            handleResize();
          });
          resizeObserver.observe(mountRef.current);
          cleanupFns.push(() => resizeObserver.disconnect());
        }

        // Animation loop
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          updateHandHandlePositions(robotScene, handHandlesRef.current);
          renderer.render(scene, camera);
        };
        animate();

        // Setup mouse controls
        if (!isIntroMode) {
          const controlsCleanup = setupControls(
            renderer,
            camera,
            () => orbitTargetRef.current,
            () => {
              hasUserInteractedRef.current = true;
            },
            () => isDraggingHandleRef.current
          );
          cleanupFns.push(controlsCleanup);
          const handDragCleanup = setupHandDragControls({
            renderer,
            camera,
            robotRoot: robotScene,
            getHandles: () => handHandlesRef.current,
            onUserInteraction: () => {
              hasUserInteractedRef.current = true;
            },
            isDraggingHandleRef,
            getCurrentAngles: () => latestJointsRef.current,
            updateLocalJoint: (jointName, degrees) => {
              const radians = THREE.MathUtils.degToRad(degrees);
              builder.updateJoint(jointName, radians);
            },
            sendServo: (id, angle) => {
              onServoCommand?.({ id, angle });
            },
          });
          cleanupFns.push(handDragCleanup);
        }

        setIsLoading(false);
        setLoadingMessage('');
        onModelReady?.();
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
      cleanupFns.forEach((cleanup) => cleanup());
      if (rendererRef.current) {
        if (mountRef.current?.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
    };
  }, [isConnected, config.rosUrl, onError, onModelReady, onServoCommand, isIntroMode]);

  // Update joint angles from ROS2 joint_states
  useEffect(() => {
    if (!urdfBuilderRef.current || !jointMappingsRef.current) return;
    latestJointsRef.current = joints;
    latestNamedJointsRef.current = jointStatesByName;

    const builder = urdfBuilderRef.current;

    // Update joints silently (no spam)
    Object.entries(jointStatesByName).forEach(([jointName, angleRadians]) => {
      if (typeof angleRadians === 'number') {
        builder.updateJoint(jointName, angleRadians);
      }
    });
  }, [joints, jointStatesByName]);

  // Direct ROS joint streaming fallback:
  // apply /joint_states updates straight to URDF builder to avoid UI state race/staleness.
  useEffect(() => {
    if (!isConnected || isLoading || !rosServiceRef.current || !urdfBuilderRef.current) {
      return;
    }

    const unsubscribe = rosServiceRef.current.subscribeToServoState((msg: any) => {
      if (!msg?.name || !msg?.position || !urdfBuilderRef.current) return;

      msg.name.forEach((jointName: string, index: number) => {
        const angleRadians = msg.position[index];
        if (Number.isFinite(angleRadians)) {
          urdfBuilderRef.current?.updateJoint(jointName, angleRadians);
        }
      });
    });

    return () => unsubscribe?.();
  }, [isConnected, isLoading, propsRosService]);

  const fitViewToRobot = () => {
    if (!cameraRef.current || !robotGroupRef.current) return;
    fitCameraToRobot(cameraRef.current, robotGroupRef.current, orbitTargetRef.current, 1.5);
  };

  // Ensure first open matches Fit View exactly (after layout settles).
  useEffect(() => {
    if (isLoading || initialAutoFitDoneRef.current) return;
    if (!cameraRef.current || !robotGroupRef.current) return;

    initialAutoFitDoneRef.current = true;
    let raf1 = 0;
    let raf2 = 0;
    const timers: number[] = [];

    const scheduleFit = (delayMs: number) => {
      const timer = window.setTimeout(() => {
        raf1 = window.requestAnimationFrame(() => {
          raf2 = window.requestAnimationFrame(() => {
            if (!hasUserInteractedRef.current) {
              fitViewToRobot();
            }
          });
        });
      }, delayMs);
      timers.push(timer);
    };

    // Multi-pass auto-fit: handles late layout/asset settling.
    scheduleFit(80);
    scheduleFit(320);
    scheduleFit(700);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [isLoading]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading Indicator */}
      {isLoading && showLoadingOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-white text-lg font-semibold">Loading 3D Model...</p>
            {showLoadingDetails && <p className="text-gray-400 text-sm mt-2">{loadingMessage}</p>}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="text-center max-w-md bg-gray-800 p-6 rounded">
            <p className="text-red-500 text-lg font-semibold mb-2">Error Loading Model</p>
            <p className="text-red-300 text-sm mb-4 break-words">{error}</p>
            <p className="text-gray-400 text-xs">Check browser console for details</p>
          </div>
        </div>
      )}

      {/* Info Overlay */}
      {showControlsHint && (
        <div className="absolute bottom-4 left-4 text-xs text-gray-400 z-10">
          <p>Drag to rotate | Scroll to zoom | Right-click to pan</p>
          <p>Drag blue/green hand points to move arms directly</p>
        </div>
      )}

      {showFitButton && (
        <button
          onClick={fitViewToRobot}
          className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 z-10"
        >
          Fit View
        </button>
      )}

      {/* Debug Info Panel */}
      {debugMode && (
        <div className="absolute top-14 right-4 bg-gray-800 border border-green-500 rounded p-3 z-10 max-w-xs">
          <h3 className="text-green-400 font-bold mb-2 text-sm">Debug Info</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <p>ROS: {isConnected ? 'Connected' : 'Disconnected'}</p>
            <p>Mode: {isConnected ? 'ROS Streaming' : 'Local Model'}</p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            {debugStats && <p>{debugStats}</p>}
            <p>Press "Fit View" anytime to re-center</p>
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
  getOrbitTarget: () => THREE.Vector3,
  onUserInteraction?: () => void,
  shouldBlockInteraction?: () => boolean
) {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };

  const domElement = renderer.domElement;

  const onMouseDown = (e: MouseEvent) => {
    if (shouldBlockInteraction?.()) return;
    isDragging = true;
    onUserInteraction?.();
    previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    const target = getOrbitTarget();
    const offset = camera.position.clone().sub(target);

    // Rotate camera around robot
    const phi = Math.atan2(offset.z, offset.x);
    const theta = Math.acos(offset.y / offset.length());
    const radius = offset.length();

    const newPhi = phi + deltaX * 0.01;
    const newTheta = Math.max(0.1, Math.min(Math.PI - 0.1, theta + deltaY * 0.01));

    camera.position.x = target.x + radius * Math.sin(newTheta) * Math.cos(newPhi);
    camera.position.y = target.y + radius * Math.cos(newTheta);
    camera.position.z = target.z + radius * Math.sin(newTheta) * Math.sin(newPhi);
    camera.lookAt(target);

    previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    isDragging = false;
  };

  const onWheel = (e: WheelEvent) => {
    console.log('[RobotViewer] Wheel event:', e.deltaY);
    if (shouldBlockInteraction?.()) {
      console.log('[RobotViewer] Wheel blocked by shouldBlockInteraction');
      return;
    }
    e.preventDefault();
    onUserInteraction?.();
    const target = getOrbitTarget();
    const offset = camera.position.clone().sub(target);

    const direction = offset.clone().normalize();
    const currentDist = offset.length();
    const newDist = Math.max(0.1, Math.min(3, currentDist + e.deltaY * 0.0002));

    console.log('[RobotViewer] Zoom: current distance:', currentDist.toFixed(2), '-> new:', newDist.toFixed(2));

    camera.position.copy(target.clone().add(direction.multiplyScalar(newDist)));
    camera.lookAt(target);
  };

  domElement.addEventListener('mousedown', onMouseDown);
  domElement.addEventListener('mousemove', onMouseMove);
  domElement.addEventListener('mouseup', onMouseUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });

  console.log('[RobotViewer setupControls] Wheel listener added with passive: false');

  return () => {
    domElement.removeEventListener('mousedown', onMouseDown);
    domElement.removeEventListener('mousemove', onMouseMove);
    domElement.removeEventListener('mouseup', onMouseUp);
    domElement.removeEventListener('wheel', onWheel);
  };
}

function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  orbitTarget: THREE.Vector3,
  offset = 1.5
) {
  const boundingBox = new THREE.Box3().setFromObject(object);
  if (boundingBox.isEmpty()) return;

  const size = boundingBox.getSize(new THREE.Vector3());
  const center = boundingBox.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = (maxDim / 2) / Math.tan(fov / 2) * offset;

  // Force a front view (InMoov front is along +X in this URDF)
  const target = center.clone();
  target.y += size.y * 0.05;
  const direction = new THREE.Vector3(1, 0.18, 0).normalize();
  camera.position.copy(target.clone().add(direction.multiplyScalar(distance)));
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  orbitTarget.copy(target);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

function fitCameraToRobot(
  camera: THREE.PerspectiveCamera,
  robotRoot: THREE.Object3D,
  orbitTarget: THREE.Vector3,
  offset = 1.5
) {
  robotRoot.updateMatrixWorld(true);

  if (fitCameraToAnchorPose(camera, robotRoot, orbitTarget, offset)) {
    return;
  }

  const focusNode = findPreferredFocusNode(robotRoot);
  if (focusNode) {
    const bounds = new THREE.Box3().setFromObject(focusNode);
    if (!bounds.isEmpty()) {
      fitCameraToBounds(camera, bounds, orbitTarget, offset);
      return;
    }
  }

  const robotBounds = computeRobotBodyBounds(robotRoot);
  if (robotBounds) {
    fitCameraToBounds(camera, robotBounds, orbitTarget, offset);
    return;
  }

  fitCameraToObject(camera, robotRoot, orbitTarget, offset);
}

function fitCameraToAnchorPose(
  camera: THREE.PerspectiveCamera,
  robotRoot: THREE.Object3D,
  orbitTarget: THREE.Vector3,
  offset = 1.5
): boolean {
  const torso = robotRoot.getObjectByName('torso_link');
  const head = robotRoot.getObjectByName('head_link') || robotRoot.getObjectByName('head_base_link');
  if (!torso || !head) return false;

  const torsoPos = new THREE.Vector3();
  const headPos = new THREE.Vector3();
  torso.getWorldPosition(torsoPos);
  head.getWorldPosition(headPos);

  const leftShoulder = robotRoot.getObjectByName('l_shoulder_link');
  const rightShoulder = robotRoot.getObjectByName('r_shoulder_link');
  const leftShoulderPos = new THREE.Vector3();
  const rightShoulderPos = new THREE.Vector3();
  let shoulderSpan = 0.45;

  if (leftShoulder && rightShoulder) {
    leftShoulder.getWorldPosition(leftShoulderPos);
    rightShoulder.getWorldPosition(rightShoulderPos);
    shoulderSpan = Math.max(0.25, leftShoulderPos.distanceTo(rightShoulderPos));
  }

  const torsoToHead = Math.max(0.3, torsoPos.distanceTo(headPos));
  const framingSize = Math.max(torsoToHead * 2.8, shoulderSpan * 2.2);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = ((framingSize / 2) / Math.tan(fov / 2)) * offset;

  const target = torsoPos.clone().lerp(headPos, 0.32);
  const direction = new THREE.Vector3(1, 0.14, 0).normalize();
  camera.position.copy(target.clone().add(direction.multiplyScalar(distance)));
  camera.near = Math.max(0.01, distance / 120);
  camera.far = distance * 120;
  orbitTarget.copy(target);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return true;
}

function findPreferredFocusNode(root: THREE.Object3D): THREE.Object3D | null {
  const preferredNames = ['torso_link', 'chestplate_link', 'top_stomach_link', 'head_link'];

  for (const name of preferredNames) {
    const node = root.getObjectByName(name);
    if (node) return node;
  }

  return null;
}

function fitCameraToBounds(
  camera: THREE.PerspectiveCamera,
  bounds: THREE.Box3,
  orbitTarget: THREE.Vector3,
  offset = 1.5
) {
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = (maxDim / 2) / Math.tan(fov / 2) * offset;

  const target = center.clone();
  target.y += size.y * 0.05;
  const direction = new THREE.Vector3(1, 0.18, 0).normalize();
  camera.position.copy(target.clone().add(direction.multiplyScalar(distance)));
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  orbitTarget.copy(target);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

function computeRobotBodyBounds(root: THREE.Object3D): THREE.Box3 | null {
  const excludedLinks = new Set(['base_link', 'pedestal_link', 'world']);
  const excludedNameHints = ['support', 'stand', 'pedestal', 'base_plate', 'rod'];
  const bounds = new THREE.Box3();
  let hasAny = false;

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;

    const ownerLink = findOwnerLinkName(obj, root);
    if (!ownerLink) return;

    const ownerLower = ownerLink.toLowerCase();
    if (excludedLinks.has(ownerLink)) return;
    if (excludedNameHints.some((hint) => ownerLower.includes(hint))) {
      return;
    }

    bounds.expandByObject(obj);
    hasAny = true;
  });

  return hasAny ? bounds : null;
}

function findOwnerLinkName(mesh: THREE.Object3D, root: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = mesh.parent;
  while (current && current !== root) {
    if (current.name && current.name.endsWith('_link')) {
      return current.name;
    }
    current = current.parent;
  }
  return null;
}

type ArmSide = 'left' | 'right';

interface ArmDragConfig {
  side: ArmSide;
  handleName: string;
  handLinkName: string;
  shoulderLinkName: string;
  shoulderOutJoint: string;
  shoulderLiftJoint: string;
  elbowJoint: string;
  shoulderOutServo: number;
  shoulderLiftServo: number;
  elbowServo: number;
}

const ARM_DRAG_CONFIG: Record<ArmSide, ArmDragConfig> = {
  right: {
    side: 'right',
    handleName: 'ik_handle_right',
    handLinkName: 'r_hand_link',
    shoulderLinkName: 'r_shoulder_link',
    shoulderOutJoint: 'r_shoulder_out_joint',
    shoulderLiftJoint: 'r_shoulder_lift_joint',
    elbowJoint: 'r_elbow_flex_joint',
    shoulderOutServo: 7,
    shoulderLiftServo: 8,
    elbowServo: 10,
  },
  left: {
    side: 'left',
    handleName: 'ik_handle_left',
    handLinkName: 'l_hand_link',
    shoulderLinkName: 'l_shoulder_link',
    shoulderOutJoint: 'l_shoulder_out_joint',
    shoulderLiftJoint: 'l_shoulder_lift_joint',
    elbowJoint: 'l_elbow_flex_joint',
    shoulderOutServo: 12,
    shoulderLiftServo: 13,
    elbowServo: 15,
  },
};

function createOrUpdateHandHandles(
  scene: THREE.Scene,
  robotRoot: THREE.Object3D,
  handles: { left?: THREE.Mesh; right?: THREE.Mesh }
) {
  (Object.keys(ARM_DRAG_CONFIG) as ArmSide[]).forEach((side) => {
    const config = ARM_DRAG_CONFIG[side];
    const handLink = robotRoot.getObjectByName(config.handLinkName);
    if (!handLink) return;

    const existing = handles[side];
    if (existing) {
      existing.userData.armSide = side;
      return;
    }

    const geometry = new THREE.SphereGeometry(0.04, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: side === 'right' ? 0x3b82f6 : 0x22c55e,
      emissive: side === 'right' ? 0x1d4ed8 : 0x166534,
      emissiveIntensity: 1.0,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.98,
      depthTest: false,
      depthWrite: false,
    });

    const handle = new THREE.Mesh(geometry, material);
    handle.name = config.handleName;
    handle.castShadow = false;
    handle.receiveShadow = false;
    handle.renderOrder = 999;
    handle.userData.armSide = side;
    scene.add(handle);
    handles[side] = handle;
  });

  updateHandHandlePositions(robotRoot, handles);
}

function updateHandHandlePositions(
  robotRoot: THREE.Object3D,
  handles: { left?: THREE.Mesh; right?: THREE.Mesh }
) {
  const worldPosition = new THREE.Vector3();
  const shoulderPosition = new THREE.Vector3();
  const direction = new THREE.Vector3();
  (Object.keys(ARM_DRAG_CONFIG) as ArmSide[]).forEach((side) => {
    const handle = handles[side];
    if (!handle) return;
    const config = ARM_DRAG_CONFIG[side];
    const handLink = robotRoot.getObjectByName(config.handLinkName);
    const shoulderLink = robotRoot.getObjectByName(config.shoulderLinkName);
    if (!handLink) return;

    handLink.getWorldPosition(worldPosition);

    if (shoulderLink) {
      shoulderLink.getWorldPosition(shoulderPosition);
      direction.copy(worldPosition).sub(shoulderPosition);
      if (direction.lengthSq() > 1e-6) {
        direction.normalize();
        // Push handle slightly outside hand volume so it is visible/clickable.
        worldPosition.addScaledVector(direction, 0.06);
      }
    }

    handle.position.copy(worldPosition);
  });
}

interface HandDragArgs {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  robotRoot: THREE.Object3D;
  getHandles: () => { left?: THREE.Mesh; right?: THREE.Mesh };
  onUserInteraction?: () => void;
  isDraggingHandleRef: React.MutableRefObject<boolean>;
  getCurrentAngles: () => Record<number, number>;
  updateLocalJoint: (jointName: string, angleDegrees: number) => void;
  sendServo: (id: number, angle: number) => void;
}

function setupHandDragControls({
  renderer,
  camera,
  robotRoot,
  getHandles,
  onUserInteraction,
  isDraggingHandleRef,
  getCurrentAngles,
  updateLocalJoint,
  sendServo,
}: HandDragArgs) {
  const domElement = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const hitPoint = new THREE.Vector3();
  const startPoint = new THREE.Vector3();
  const deltaVec = new THREE.Vector3();
  const rightAxis = new THREE.Vector3();
  const upAxis = new THREE.Vector3();
  const camDir = new THREE.Vector3();

  let activeArm: ArmSide | null = null;
  let startShoulderOut = 0;
  let startShoulderLift = 0;
  let startElbow = 0;
  let startDistance = 0.1;

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const setPointer = (event: MouseEvent) => {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const resolveCurrentAngles = (config: ArmDragConfig) => {
    const angles = getCurrentAngles();
    return {
      shoulderOut: angles[config.shoulderOutServo] ?? 0,
      shoulderLift: angles[config.shoulderLiftServo] ?? 0,
      elbow: angles[config.elbowServo] ?? 25,
    };
  };

  const applyArmAngles = (config: ArmDragConfig, shoulderOut: number, shoulderLift: number, elbow: number) => {
    updateLocalJoint(config.shoulderOutJoint, shoulderOut);
    updateLocalJoint(config.shoulderLiftJoint, shoulderLift);
    updateLocalJoint(config.elbowJoint, elbow);

    sendServo(config.shoulderOutServo, shoulderOut);
    sendServo(config.shoulderLiftServo, shoulderLift);
    sendServo(config.elbowServo, elbow);
  };

  const onMouseDown = (event: MouseEvent) => {
    const handlesObj = getHandles();
    const handles: THREE.Object3D[] = [handlesObj.left, handlesObj.right].filter(Boolean) as THREE.Object3D[];
    if (handles.length === 0) return;

    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(handles, false);
    if (intersections.length === 0) return;

    const hit = intersections[0];
    const hitSide = hit.object.userData.armSide as ArmSide | undefined;
    if (!hitSide) return;
    const config = ARM_DRAG_CONFIG[hitSide];

    const current = resolveCurrentAngles(config);
    startShoulderOut = current.shoulderOut;
    startShoulderLift = current.shoulderLift;
    startElbow = current.elbow;
    activeArm = hitSide;
    isDraggingHandleRef.current = true;
    onUserInteraction?.();

    startPoint.copy(hit.point);
    camera.getWorldDirection(camDir).normalize();
    dragPlane.setFromNormalAndCoplanarPoint(camDir, hit.point);

    const shoulderLink = robotRoot.getObjectByName(config.shoulderLinkName);
    if (shoulderLink) {
      const shoulderPos = new THREE.Vector3();
      shoulderLink.getWorldPosition(shoulderPos);
      startDistance = Math.max(0.05, shoulderPos.distanceTo(hit.point));
    } else {
      startDistance = 0.2;
    }
  };

  const onMouseMove = (event: MouseEvent) => {
    const handlesObj = getHandles();
    const handleList: THREE.Object3D[] = [handlesObj.left, handlesObj.right].filter(Boolean) as THREE.Object3D[];

    // Hover feedback when not dragging.
    if (!activeArm && handleList.length > 0) {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hovered = raycaster.intersectObjects(handleList, false);
      handleList.forEach((obj) => obj.scale.setScalar(1));
      if (hovered.length > 0) {
        hovered[0].object.scale.setScalar(1.3);
      }
    }

    if (!activeArm) return;
    const config = ARM_DRAG_CONFIG[activeArm];

    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hitOk = raycaster.ray.intersectPlane(dragPlane, hitPoint);
    if (!hitOk) return;

    deltaVec.copy(hitPoint).sub(startPoint);

    camera.getWorldDirection(camDir).normalize();
    rightAxis.crossVectors(camDir, camera.up).normalize();
    upAxis.copy(camera.up).normalize();

    const dx = deltaVec.dot(rightAxis);
    const dy = deltaVec.dot(upAxis);
    const sideSign = activeArm === 'right' ? 1 : -1;

    const shoulderOut = clamp(startShoulderOut + dx * 260 * sideSign, -90, 90);
    const shoulderLift = clamp(startShoulderLift - dy * 260, -90, 90);

    const shoulderLink = robotRoot.getObjectByName(config.shoulderLinkName);
    let elbow = startElbow;
    if (shoulderLink) {
      const shoulderPos = new THREE.Vector3();
      shoulderLink.getWorldPosition(shoulderPos);
      const currentDistance = Math.max(0.05, shoulderPos.distanceTo(hitPoint));
      elbow = clamp(startElbow + (currentDistance - startDistance) * 280, 0, 130);
    }

    applyArmAngles(config, shoulderOut, shoulderLift, elbow);
  };

  const onMouseUp = () => {
    activeArm = null;
    isDraggingHandleRef.current = false;
    const handlesObj = getHandles();
    [handlesObj.left, handlesObj.right].forEach((obj) => obj?.scale.setScalar(1));
  };

  domElement.addEventListener('mousedown', onMouseDown);
  domElement.addEventListener('mousemove', onMouseMove);
  domElement.addEventListener('mouseup', onMouseUp);
  domElement.addEventListener('mouseleave', onMouseUp);

  return () => {
    domElement.removeEventListener('mousedown', onMouseDown);
    domElement.removeEventListener('mousemove', onMouseMove);
    domElement.removeEventListener('mouseup', onMouseUp);
    domElement.removeEventListener('mouseleave', onMouseUp);
  };
}

export default RobotViewer;
