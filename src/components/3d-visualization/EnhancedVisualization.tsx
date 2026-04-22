/**
 * Enhanced 3D Robot Visualization Component
 * Integrates: Robot Visual, Collision Meshes, Scene Objects, Markers,
 * Trajectory Playback, and TF Frame visualization - all in one view
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { parseURDF } from '../../services/urdf.loader';
import { URDFBuilder } from '../../services/urdf.builder';
import { CollisionMeshLoader, CollisionGeometry } from '../../services/collision.loader';
import { MarkerArrayRenderer, Marker } from '../../services/marker.renderer';
import { TFFrameVisualizer, TFFrame } from '../../services/tf.visualizer';
import { TrajectoryPlayer, PlaybackState, PlaybackCallback } from '../../services/trajectory.player';
import { SRDFParser } from '../../services/srdf.parser';
import { ROSService, JOINT_NAME_TO_SERVO_ID } from '../../services/ros.service';
import { useAppStore } from '../../store/appStore';
import { ModelService } from '../../services/model.service';

export interface EnhancedVisualizationProps {
  joints: Record<number, number>;
  jointStatesByName?: Record<string, number>;
  isConnected: boolean;
  rosService?: ROSService | null;
  onError?: (error: string) => void;
  showCollisions?: boolean;
  showMarkers?: boolean;
  showTF?: boolean;
  showTrajectoryControls?: boolean;
  onJointDrag?: (jointName: string, deltaAngle: number) => void;
}

/**
 * Enhanced 3D Visualization with full MoveIt feature parity
 */
const EnhancedVisualization: React.FC<EnhancedVisualizationProps> = ({
  joints,
  jointStatesByName = {},
  isConnected,
  rosService: propsRosService,
  onError,
  showCollisions = true,
  showMarkers = true,
  showTF = false,
  showTrajectoryControls = true,
  onJointDrag,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const urdfBuilderRef = useRef<URDFBuilder | null>(null);
  const collisionLoaderRef = useRef<CollisionMeshLoader | null>(null);
  const markerRendererRef = useRef<MarkerArrayRenderer | null>(null);
  const tfVisualizerRef = useRef<TFFrameVisualizer | null>(null);
  const trajectoryPlayerRef = useRef<TrajectoryPlayer>(new TrajectoryPlayer());
  const rosServiceRef = useRef<ROSService | null>(propsRosService || null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [collisionCount, setCollisionCount] = useState(0);
  const [markerCount, setMarkerCount] = useState(0);
  const [tfCount, setTFCount] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.STOPPED);
  const [currentTime, setCurrentTime] = useState(0);

  const { config } = useAppStore();

  useEffect(() => {
    rosServiceRef.current = propsRosService || rosServiceRef.current;
  }, [propsRosService]);

  // Initialize scene and load all geometry
  useEffect(() => {
    if (!mountRef.current) return;

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

        // Camera
        const camera = new THREE.PerspectiveCamera(
          75,
          mountRef.current!.clientWidth / mountRef.current!.clientHeight,
          0.01,
          1000
        );
        camera.position.set(1, 0.8, 1.5);
        camera.lookAt(0, 0.5, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.pixelRatio = Math.min(window.devicePixelRatio, 2);
        mountRef.current!.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting Enhancements
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.8);
        hemiLight.position.set(0, 2, 0);
        scene.add(hemiLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(2, 3, 2);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xaaccff, 0.8);
        backLight.position.set(-2, 2, -2);
        scene.add(backLight);

        // Ground & Grid
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({
          color: 0x222233,
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01; // Slightly below 0 to prevent z-fighting with grid
        ground.receiveShadow = true;
        scene.add(ground);

        const gridHelper = new THREE.GridHelper(10, 20, 0x555566, 0x333344);
        scene.add(gridHelper);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 0.6, 0);
        controls.maxDistance = 5;
        controls.minDistance = 0.2;
        controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go too far below ground

        // Load URDF & Build Robot
        const modelService = ModelService.getInstance();
        let robotScene: THREE.Group;
        let builder: URDFBuilder;

        if (modelService.isModelReady()) {
          setLoadingMessage('Using preloaded model...');
          // Clone the robot scene to allow multiple views or clean restarts
          // Note: updateJoint needs the specific builder instance
          builder = modelService.getBuilder()!;
          robotScene = modelService.getRobotScene()!;
          
          // Re-add to current scene (it will be removed from any previous parent)
          scene.add(robotScene);
        } else {
          // Fallback to manual load if not ready
          setLoadingMessage('Loading URDF...');
          let urdfString: string;
          try {
            if (isConnected && rosServiceRef.current) {
              urdfString = await rosServiceRef.current.loadURDF();
            } else {
              const response = await fetch('/data/inmoov-local.urdf');
              urdfString = await response.text();
            }
          } catch (err) {
            const response = await fetch('/data/inmoov-local.urdf');
            urdfString = await response.text();
          }

          setLoadingMessage('Parsing URDF...');
          const urdf = parseURDF(urdfString);

          // Build robot
          setLoadingMessage('Building robot scene...');
          builder = new URDFBuilder(urdf, msg => setLoadingMessage(msg));
          robotScene = await builder.build();
          robotScene.rotation.x = -Math.PI / 2;
          robotScene.position.y = 0.3;
          scene.add(robotScene);
        }

        robotGroupRef.current = robotScene;
        urdfBuilderRef.current = builder;

        // Auto-fit camera to robot
        const bbox = new THREE.Box3().setFromObject(robotScene);
        if (!bbox.isEmpty()) {
          const size = bbox.getSize(new THREE.Vector3());
          const center = bbox.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = THREE.MathUtils.degToRad(camera.fov);
          const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

          camera.position.set(
            center.x + distance * 0.4,
            center.y + distance * 0.2,
            center.z + distance * 0.7
          );
          controls.target.copy(center);
          controls.update();

          camera.near = Math.max(0.01, distance / 100);
          camera.far = distance * 100;
          camera.updateProjectionMatrix();
        }

        // Load collision meshes
        if (showCollisions) {
          setLoadingMessage('Loading collision meshes...');
          const collisionLoader = new CollisionMeshLoader();
          collisionLoaderRef.current = collisionLoader;
          
          // Use URDF from service or builder
          const currentURDF = modelService.getURDF() || (builder as any).urdf;
          await collisionLoader.loadAllCollisionMeshes(currentURDF.links, '/meshes/');
          scene.add(collisionLoader.getCollisionGroup());
          collisionLoader.setCollisionVisibility(false); // Hidden by default
        }

        // Setup marker renderer
        if (showMarkers) {
          setLoadingMessage('Setting up marker system...');
          const markerRenderer = new MarkerArrayRenderer(scene);
          markerRendererRef.current = markerRenderer;
          markerRenderer.setMarkerVisibility(true);
        }

        // Setup TF visualizer
        if (showTF) {
          setLoadingMessage('Setting up TF frame display...');
          const tfVisualizer = new TFFrameVisualizer(scene);
          tfVisualizerRef.current = tfVisualizer;
          tfVisualizer.setAllFrameVisibility(false);
        }

        // Setup ROS subscriptions
        if (isConnected && rosServiceRef.current) {
          setLoadingMessage('Setting up ROS subscriptions...');

          // Subscribe to markers
          if (markerRendererRef.current) {
            rosServiceRef.current.subscribeToMarkerArray(markers => {
              markerRendererRef.current?.updateMarkerArray(markers as Marker[]);
              setMarkerCount(markerRendererRef.current?.getMarkerCount() || 0);
            });
          }

          // Subscribe to single markers
          if (markerRendererRef.current) {
            rosServiceRef.current.subscribeToMarker(marker => {
              markerRendererRef.current?.updateMarker(marker as Marker);
            });
          }

          // Subscribe to TF frames
          if (tfVisualizerRef.current) {
            rosServiceRef.current.subscribeToTF(transforms => {
              transforms.forEach((tf: any) => {
                const frame: TFFrame = {
                  name: tf.child_frame_id,
                  parentName: tf.header.frame_id,
                  position: [
                    tf.transform.translation.x,
                    tf.transform.translation.y,
                    tf.transform.translation.z,
                  ],
                  quaternion: [
                    tf.transform.rotation.x,
                    tf.transform.rotation.y,
                    tf.transform.rotation.z,
                    tf.transform.rotation.w,
                  ],
                };
                tfVisualizerRef.current?.updateFrame(frame);
              });
              setTFCount(tfVisualizerRef.current?.getFrameCount() || 0);
            });
          }
        }

        // Setup trajectory player callback
        const trajectoryPlayerUnsubscribe = trajectoryPlayerRef.current.subscribe(
          (state, time, positions) => {
            setPlaybackState(state);
            setCurrentTime(time);
            // Apply trajectory positions to robot
            Object.entries(positions).forEach(([jointName, angle]) => {
              builder.updateJoint(jointName, angle);
            });
          }
        );
        cleanupFns.push(trajectoryPlayerUnsubscribe);

        // Raycasting for interactive joint dragging
        let draggedJoint: string | null = null;
        let lastMouseY = 0;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onPointerDown = (e: PointerEvent) => {
          if (e.button !== 0) return; // Only left click

          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);

          const intersects = raycaster.intersectObjects(scene.children, true);
          if (intersects.length > 0) {
            let current: THREE.Object3D | null = intersects[0].object;
            while (current) {
              if (current.userData?.isJoint && current.userData?.jointName) {
                draggedJoint = current.userData.jointName;
                lastMouseY = e.clientY;
                controls.enabled = false;
                renderer.domElement.style.cursor = 'ns-resize';
                e.stopPropagation(); // Stop orbit controls if we hit a joint
                break;
              }
              current = current.parent;
            }
          }
        };

        const onPointerMove = (e: PointerEvent) => {
          if (draggedJoint && onJointDrag) {
            const deltaY = lastMouseY - e.clientY; // Up is positive
            lastMouseY = e.clientY;
            // Sensitivity: 1 pixel = 1 degree
            onJointDrag(draggedJoint, deltaY * 1.0);
          }
        };

        const onPointerUp = () => {
          if (draggedJoint) {
            draggedJoint = null;
            controls.enabled = true;
            renderer.domElement.style.cursor = 'grab';
          }
        };

        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        renderer.domElement.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        cleanupFns.push(() => {
          renderer.domElement.removeEventListener('pointerdown', onPointerDown);
          renderer.domElement.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
        });


        // Animation loop
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          controls.update(); // required if controls.enableDamping or controls.autoRotate are set
          renderer.render(scene, camera);
        };
        animate();

        // OrbitControls handles mouse interactions now

        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[Enhanced Visualization] Error:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
      }
    };

    setupScene();

    return () => {
      cancelAnimationFrame(animationFrameId);
      cleanupFns.forEach(fn => fn());
      if (rendererRef.current?.domElement.parentElement === mountRef.current) {
        mountRef.current?.removeChild(rendererRef.current.domElement);
      }
    };
  }, [isConnected, config.rosUrl, showCollisions, showMarkers, showTF]);

  // Update joint states
  useEffect(() => {
    if (!urdfBuilderRef.current) return;

    Object.entries(jointStatesByName).forEach(([jointName, angle]) => {
      if (typeof angle === 'number') {
        urdfBuilderRef.current?.updateJoint(jointName, angle);
      }
    });
  }, [jointStatesByName]);

  // Direct ROS joint streaming fallback:
  // keep robot animation live even if upstream React state misses updates.
  useEffect(() => {
    if (!isConnected || isLoading || !rosServiceRef.current || !urdfBuilderRef.current) {
      return;
    }

    const unsubscribe = rosServiceRef.current.subscribeToServoState((msg: any) => {
      if (!msg?.name || !msg?.position || !urdfBuilderRef.current) return;

      msg.name.forEach((jointName: string, index: number) => {
        const angleRadians = msg.position[index];
        if (typeof angleRadians === 'number') {
          urdfBuilderRef.current?.updateJoint(jointName, angleRadians);
        }
      });
    });

    return () => unsubscribe?.();
  }, [isConnected, isLoading, propsRosService]);

  // Toggle collision visibility
  const toggleCollisions = () => {
    if (collisionLoaderRef.current) {
      const isVisible = collisionLoaderRef.current.getCollisionGroup().visible;
      collisionLoaderRef.current.setCollisionVisibility(!isVisible);
    }
  };

  // Toggle TF visibility
  const toggleTF = () => {
    if (tfVisualizerRef.current) {
      tfVisualizerRef.current.setAllFrameVisibility(
        !tfVisualizerRef.current.getFrameGroup().visible
      );
    }
  };

  // Toggle markers visibility
  const toggleMarkers = () => {
    if (markerRendererRef.current) {
      markerRendererRef.current.setMarkerVisibility(
        !markerRendererRef.current.getMarkerGroup().visible
      );
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="bg-gray-800 p-4 rounded max-w-md">
            <p className="text-red-500 font-bold">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Visualization Controls */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {showCollisions && (
          <button
            onClick={toggleCollisions}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            title="Toggle collision meshes"
          >
            Collisions
          </button>
        )}
        {showMarkers && (
          <button
            onClick={toggleMarkers}
            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
            title="Toggle markers (objects, faces)"
          >
            Markers ({markerCount})
          </button>
        )}
        {showTF && (
          <button
            onClick={toggleTF}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            title="Toggle TF frames"
          >
            TF Frames ({tfCount})
          </button>
        )}
      </div>

      {/* Trajectory Playback Controls */}
      {showTrajectoryControls && (
        <div className="absolute bottom-4 left-4 bg-gray-800 p-3 rounded border border-gray-700 z-10">
          <div className="text-xs text-gray-300 mb-2">
            Trajectory: {playbackState} | Time: {currentTime.toFixed(2)}s
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => trajectoryPlayerRef.current.play('default')}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Play
            </button>
            <button
              onClick={() => trajectoryPlayerRef.current.pause()}
              className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
            >
              Pause
            </button>
            <button
              onClick={() => trajectoryPlayerRef.current.stop()}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="absolute top-14 right-4 bg-gray-800 p-2 rounded text-xs text-gray-300 z-10">
        <p>Connected: {isConnected ? '🟢' : '🔴'}</p>
        <p>Collisions: {collisionCount}</p>
        <p>Markers: {markerCount}</p>
        <p>TF Frames: {tfCount}</p>
      </div>
    </div>
  );
};

export default EnhancedVisualization;
