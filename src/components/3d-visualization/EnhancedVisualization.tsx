/**
 * Enhanced 3D Robot Visualization Component
 * Integrates: Robot Visual, Collision Meshes, Scene Objects, Markers,
 * Trajectory Playback, and TF Frame visualization - all in one view
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { parseURDF } from '../../services/urdf.loader';
import { URDFBuilder } from '../../services/urdf.builder';
import { CollisionMeshLoader, CollisionGeometry } from '../../services/collision.loader';
import { MarkerArrayRenderer, Marker } from '../../services/marker.renderer';
import { TFFrameVisualizer, TFFrame } from '../../services/tf.visualizer';
import { TrajectoryPlayer, PlaybackState, PlaybackCallback } from '../../services/trajectory.player';
import { SRDFParser } from '../../services/srdf.parser';
import { ROSService, JOINT_NAME_TO_SERVO_ID } from '../../services/ros.service';
import { useAppStore } from '../../store/appStore';

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

        // Lighting
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

        const pointLight = new THREE.PointLight(0xffffff, 0.6);
        pointLight.position.set(-1, 0.5, 1);
        scene.add(pointLight);

        // Ground
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
        const builder = new URDFBuilder(urdf, msg => setLoadingMessage(msg));
        const robotScene = await builder.build();
        robotGroupRef.current = robotScene;
        robotScene.rotation.x = -Math.PI / 2;
        robotScene.position.y = 0.3;
        scene.add(robotScene);
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
            center.x + distance * 0.6,
            center.y + distance * 0.3,
            center.z + distance * 0.8
          );
          camera.lookAt(center);
          camera.near = Math.max(0.01, distance / 100);
          camera.far = distance * 100;
          camera.updateProjectionMatrix();
        }

        // Load collision meshes
        if (showCollisions) {
          setLoadingMessage('Loading collision meshes...');
          const collisionLoader = new CollisionMeshLoader();
          collisionLoaderRef.current = collisionLoader;
          await collisionLoader.loadAllCollisionMeshes(urdf.links, '/meshes/');
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

        // Animation loop
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();

        // Mouse controls for camera rotation and zoom
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        const orbitTarget = new THREE.Vector3(0, 0.5, 0);

        const onMouseDown = (e: MouseEvent) => {
          isDragging = true;
          previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;

          const deltaX = e.clientX - previousMousePosition.x;
          const deltaY = e.clientY - previousMousePosition.y;
          const offset = camera.position.clone().sub(orbitTarget);

          // Rotate camera around robot
          const phi = Math.atan2(offset.z, offset.x);
          const theta = Math.acos(Math.max(-1, Math.min(1, offset.y / offset.length())));
          const radius = offset.length();

          const newPhi = phi + deltaX * 0.01;
          const newTheta = Math.max(0.1, Math.min(Math.PI - 0.1, theta + deltaY * 0.01));

          camera.position.x = orbitTarget.x + radius * Math.sin(newTheta) * Math.cos(newPhi);
          camera.position.y = orbitTarget.y + radius * Math.cos(newTheta);
          camera.position.z = orbitTarget.z + radius * Math.sin(newTheta) * Math.sin(newPhi);
          camera.lookAt(orbitTarget);

          previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseUp = () => {
          isDragging = false;
        };

        const onWheel = (e: WheelEvent) => {
          e.preventDefault();
          const offset = camera.position.clone().sub(orbitTarget);
          const direction = offset.clone().normalize();
          const currentDist = offset.length();
          const newDist = Math.max(0.1, Math.min(5, currentDist + e.deltaY * 0.0005));

          camera.position.copy(orbitTarget.clone().add(direction.multiplyScalar(newDist)));
          camera.lookAt(orbitTarget);
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
        renderer.domElement.style.cursor = 'grab';

        cleanupFns.push(() => {
          renderer.domElement.removeEventListener('mousedown', onMouseDown);
          renderer.domElement.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          renderer.domElement.removeEventListener('wheel', onWheel);
        });

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
