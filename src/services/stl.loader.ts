/**
 * Binary STL Loader for Three.js
 * Loads STL mesh files and converts them to Three.js geometry
 */

import * as THREE from 'three';

export class STLLoader {
  /**
   * Load STL file from URL and return Three.js geometry
   * @param url Path to STL file (e.g., '/meshes/head.stl')
   * @returns Promise<THREE.BufferGeometry>
   */
  static async load(url: string): Promise<THREE.BufferGeometry> {
    try {
      // Handle asset URLs - convert /meshes/ paths to import.meta.url based paths
      let fetchUrl = url;
      
      // In Vite, assets in src/ need to be resolved properly
      if (url.startsWith('/meshes/')) {
        // Use new URL() for proper asset resolution in Vite
        fetchUrl = new URL(`../meshes/${url.replace('/meshes/', '')}`, import.meta.url).href;
      }

      console.log('Fetching STL from:', fetchUrl);
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Failed to load STL: ${response.status} ${response.statusText} from ${fetchUrl}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log(`Successfully loaded STL (${(arrayBuffer.byteLength / 1024).toFixed(2)}KB): ${url}`);
      
      return this.parseSTL(arrayBuffer);
    } catch (error) {
      console.error(`Error loading STL file ${url}:`, error);
      throw error;
    }
  }

  /**
   * Parse binary STL data into Three.js geometry
   * Binary STL format:
   * - 80 byte header
   * - 4 byte uint32 (number of triangles)
   * - For each triangle:
   *   - 12 bytes float32 normal vector (3 * 4)
   *   - 12 bytes float32 vertex 1 (3 * 4)
   *   - 12 bytes float32 vertex 2 (3 * 4)
   *   - 12 bytes float32 vertex 3 (3 * 4)
   *   - 2 bytes uint16 (attribute byte count, usually 0)
   */
  private static parseSTL(arrayBuffer: ArrayBuffer): THREE.BufferGeometry {
    const view = new DataView(arrayBuffer);
    
    // Check if it's a valid binary STL
    // Header is 80 bytes, then 4 bytes for triangle count
    const triangles = view.getUint32(80, true);
    
    // Calculate expected file size for binary STL
    const expectedSize = 80 + 4 + triangles * 50; // 50 bytes per triangle
    if (arrayBuffer.byteLength !== expectedSize) {
      // If size doesn't match, try to parse as ASCII STL
      return this.parseASCIISTL(arrayBuffer);
    }

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];

    let offset = 84; // Skip header (80) + triangle count (4)

    for (let i = 0; i < triangles; i++) {
      // Read normal vector (3 floats, 12 bytes)
      const nx = view.getFloat32(offset, true);
      offset += 4;
      const ny = view.getFloat32(offset, true);
      offset += 4;
      const nz = view.getFloat32(offset, true);
      offset += 4;

      // Read 3 vertices (3 floats each, 12 bytes per vertex)
      for (let j = 0; j < 3; j++) {
        vertices.push(view.getFloat32(offset, true));
        offset += 4;
        vertices.push(view.getFloat32(offset, true));
        offset += 4;
        vertices.push(view.getFloat32(offset, true));
        offset += 4;

        normals.push(nx, ny, nz);
      }

      // Skip attribute byte count (2 bytes)
      offset += 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.computeBoundingBox();

    return geometry;
  }

  /**
   * Parse ASCII STL format as fallback
   */
  private static parseASCIISTL(arrayBuffer: ArrayBuffer): THREE.BufferGeometry {
    const view = new Uint8Array(arrayBuffer);
    const text = new TextDecoder().decode(view);

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];

    // Parse ASCII STL format
    const vertexPattern = /vertex\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;
    const normalPattern = /facet\s+normal\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;

    let normalMatch;
    const normalArray: number[] = [];

    while ((normalMatch = normalPattern.exec(text)) !== null) {
      normalArray.push(
        parseFloat(normalMatch[1]),
        parseFloat(normalMatch[3]),
        parseFloat(normalMatch[5])
      );
    }

    let vertexMatch;
    let normalIndex = 0;

    while ((vertexMatch = vertexPattern.exec(text)) !== null) {
      vertices.push(
        parseFloat(vertexMatch[1]),
        parseFloat(vertexMatch[3]),
        parseFloat(vertexMatch[5])
      );

      const normalIdx = Math.floor(vertices.length / 9) - 1;
      if (normalIdx < normalArray.length / 3) {
        const n = normalIdx * 3;
        normals.push(normalArray[n], normalArray[n + 1], normalArray[n + 2]);
      } else {
        normals.push(0, 1, 0);
      }
    }

    if (vertices.length === 0) {
      throw new Error('No vertices found in STL file');
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    return geometry;
  }

  /**
   * Create a Three.js mesh from STL geometry
   */
  static createMesh(geometry: THREE.BufferGeometry, material?: THREE.Material): THREE.Mesh {
    if (!material) {
      material = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        emissive: 0x222222,
        shininess: 200,
        side: THREE.DoubleSide,
      });
    }
    return new THREE.Mesh(geometry, material);
  }
}
