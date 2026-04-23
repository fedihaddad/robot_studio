import { parseURDF, URDFRobot } from './urdf.loader';
import { URDFBuilder, STLLoader } from './urdf.builder';
import * as THREE from 'three';

/**
 * ModelService - Singleton to preload and cache 3D robot models
 * Ensures the robot is ready before the user enters the 3D page.
 */
export class ModelService {
  private static instance: ModelService;
  private urdfString: string | null = null;
  private urdf: URDFRobot | null = null;
  private robotScene: THREE.Group | null = null;
  private builder: URDFBuilder | null = null;
  private isLoading: boolean = false;
  private loadPromise: Promise<THREE.Group> | null = null;

  private constructor() {}

  public static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  /**
   * Start preloading the robot model
   */
  public async preloadModel(rosUrl?: string): Promise<THREE.Group> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      this.isLoading = true;
      console.log('🤖 [ModelService] Starting global model preload...');

      try {
        // 1. Load URDF
        if (!this.urdfString) {
          try {
            const urdfCandidates = [
              new URL('../../public/data/inmoov-local.urdf', import.meta.url).toString(),
              new URL('../data/inmoov-local.urdf', window.location.href).toString(),
              new URL('./data/inmoov-local.urdf', window.location.href).toString(),
              '/data/inmoov-local.urdf',
            ];

            let loaded = false;
            for (const candidate of urdfCandidates) {
              try {
                const response = await fetch(candidate);
                if (!response.ok) continue;
                this.urdfString = await response.text();
                loaded = true;
                break;
              } catch {
                // try next candidate
              }
            }

            if (!loaded || !this.urdfString) {
              throw new Error('Unable to load local URDF from packaged paths');
            }
          } catch (err) {
            console.error('Failed to load local URDF, trying fallback', err);
            // In a real app we might try ROS here if rosUrl is provided
            throw err;
          }
        }

        // 2. Parse URDF
        this.urdf = parseURDF(this.urdfString);

        // 3. Preload all meshes (Parallel)
        const meshUrls = this.urdf.links
          .filter(link => link.geometry?.type === 'mesh' && link.geometry.filename)
          .map(link => this.resolveMeshPath(link.geometry!.filename!));
        
        console.log(`🤖 [ModelService] Preloading ${meshUrls.length} STL meshes...`);
        // Limit concurrency and yield between batches to keep the intro animation smooth.
        await STLLoader.preload(meshUrls, { concurrency: 3, yieldMs: 0 });

        // 4. Build Robot Scene
        this.builder = new URDFBuilder(this.urdf);
        this.robotScene = await this.builder.build();
        
        // Hide by default until displayed
        this.robotScene.rotation.x = -Math.PI / 2;
        this.robotScene.position.y = 0.3;

        console.log('🤖 [ModelService] ✓ Model preloaded and ready.');
        this.isLoading = false;
        return this.robotScene;
      } catch (error) {
        this.isLoading = false;
        this.loadPromise = null;
        console.error('🤖 [ModelService] ✗ Preload failed:', error);
        throw error;
      }
    })();

    return this.loadPromise;
  }

  public isModelReady(): boolean {
    return !!this.robotScene;
  }

  public getRobotScene(): THREE.Group | null {
    return this.robotScene;
  }

  public getBuilder(): URDFBuilder | null {
    return this.builder;
  }

  public getURDF(): URDFRobot | null {
    return this.urdf;
  }

  /**
   * Resolves package:// paths to public folder paths
   * Duplicated from URDFBuilder for preloading logic
   */
  private resolveMeshPath(filename: string): string {
    const toRuntimePath = (relativePath: string): string => {
      const normalized = relativePath.replace(/^\/+/, '');
      if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
        try {
          const baseDir = new URL('./', window.location.href);
          return new URL(normalized, baseDir).toString();
        } catch {
          return normalized;
        }
      }
      return `/${normalized}`;
    };

    if (filename.startsWith('package://')) {
      const withoutProtocol = filename.substring('package://'.length);
      if (withoutProtocol.startsWith('meshes/')) {
        return toRuntimePath(withoutProtocol);
      }
      const meshesIndex = withoutProtocol.indexOf('/meshes/');
      if (meshesIndex >= 0) {
        return toRuntimePath(withoutProtocol.substring(meshesIndex + 1));
      }
      const meshFile = withoutProtocol.split('/').pop();
      return toRuntimePath(`meshes/${meshFile}`);
    }
    return filename;
  }
}
