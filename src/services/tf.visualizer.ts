/**
 * TF Frame Visualizer
 * Renders coordinate frame axes (RGB for XYZ) from TF transforms
 * Helps with debugging and understanding robot kinematics
 */

import * as THREE from 'three';

export interface TFFrame {
  name: string;
  parentName?: string;
  position: [number, number, number];
  quaternion: [number, number, number, number]; // [x, y, z, w]
}

export class TFFrameVisualizer {
  private scene: THREE.Scene;
  private frameAxes: Map<string, THREE.Group> = new Map();
  private frameGroup: THREE.Group;
  private axisLength: number = 0.1;
  private showLabels: boolean = false;
  private lineWidth: number = 2;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.frameGroup = new THREE.Group();
    this.frameGroup.name = 'tf_frames';
    this.scene.add(this.frameGroup);
  }

  /**
   * Update frame position and orientation
   */
  updateFrame(frame: TFFrame): void {
    let axisGroup = this.frameAxes.get(frame.name);

    if (!axisGroup) {
      // Create new axis group
      axisGroup = this.createAxisGroup(frame.name);
      this.frameAxes.set(frame.name, axisGroup);
      this.frameGroup.add(axisGroup);
    }

    // Update position
    axisGroup.position.set(frame.position[0], frame.position[1], frame.position[2]);

    // Update rotation from quaternion
    const quat = new THREE.Quaternion(
      frame.quaternion[0],
      frame.quaternion[1],
      frame.quaternion[2],
      frame.quaternion[3]
    );
    axisGroup.quaternion.copy(quat);
  }

  /**
   * Create axis group for a frame
   */
  private createAxisGroup(frameName: string): THREE.Group {
    const group = new THREE.Group();
    group.name = `frame_${frameName}`;
    group.userData.frameName = frameName;

    // X axis (Red)
    const xAxis = this.createAxis([1, 0, 0]);
    group.add(xAxis);

    // Y axis (Green)
    const yAxis = this.createAxis([0, 1, 0]);
    group.add(yAxis);

    // Z axis (Blue)
    const zAxis = this.createAxis([0, 0, 1]);
    group.add(zAxis);

    // Optional: Add frame origin sphere
    const originGeometry = new THREE.SphereGeometry(0.01, 8, 8);
    const originMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const origin = new THREE.Mesh(originGeometry, originMaterial);
    origin.name = `origin_${frameName}`;
    group.add(origin);

    // Optional: Add frame label
    if (this.showLabels) {
      const label = this.createLabel(frameName);
      label.position.set(0, 0.15, 0);
      group.add(label);
    }

    return group;
  }

  /**
   * Create axis line
   */
  private createAxis(colorRGB: [number, number, number]): THREE.Line {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0,
      0,
      0, // origin
      this.axisLength * colorRGB[0],
      this.axisLength * colorRGB[1],
      this.axisLength * colorRGB[2], // end
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(colorRGB[0], colorRGB[1], colorRGB[2]),
      linewidth: this.lineWidth,
      fog: false,
    });

    return new THREE.Line(geometry, material);
  }

  /**
   * Create text label for frame
   */
  private createLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.font = 'Bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.substring(0, 10), 32, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.1, 0.1, 1);

    return sprite;
  }

  /**
   * Update multiple frames
   */
  updateFrames(frames: TFFrame[]): void {
    frames.forEach(frame => this.updateFrame(frame));
  }

  /**
   * Delete frame
   */
  deleteFrame(frameName: string): void {
    const axisGroup = this.frameAxes.get(frameName);
    if (axisGroup) {
      this.frameGroup.remove(axisGroup);

      // Dispose geometries and materials
      axisGroup.traverse(child => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          child.material.dispose();
        } else if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        } else if (child instanceof THREE.Sprite) {
          child.material.dispose();
        }
      });

      this.frameAxes.delete(frameName);
    }
  }

  /**
   * Show selected frames
   */
  showFrames(frameNames: string[]): void {
    const framesToShow = new Set(frameNames);
    this.frameAxes.forEach((axisGroup, frameName) => {
      axisGroup.visible = framesToShow.has(frameName);
    });
  }

  /**
   * Show all frames
   */
  showAllFrames(): void {
    this.frameAxes.forEach(axisGroup => {
      axisGroup.visible = true;
    });
  }

  /**
   * Hide all frames
   */
  hideAllFrames(): void {
    this.frameAxes.forEach(axisGroup => {
      axisGroup.visible = false;
    });
  }

  /**
   * Toggle frame visibility
   */
  setFrameVisibility(frameName: string, visible: boolean): void {
    const axisGroup = this.frameAxes.get(frameName);
    if (axisGroup) {
      axisGroup.visible = visible;
    }
  }

  /**
   * Toggle all frame visibility
   */
  setAllFrameVisibility(visible: boolean): void {
    this.frameGroup.visible = visible;
  }

  /**
   * Set axis length
   */
  setAxisLength(length: number): void {
    this.axisLength = Math.max(0.01, Math.min(1, length));
    // Recreate all axes with new length
    this.frameAxes.forEach((axisGroup, frameName) => {
      this.frameGroup.remove(axisGroup);
      this.frameAxes.delete(frameName);
    });
  }

  /**
   * Get frame by name
   */
  getFrame(frameName: string): TFFrame | undefined {
    const axisGroup = this.frameAxes.get(frameName);
    if (!axisGroup) return undefined;

    return {
      name: frameName,
      position: [axisGroup.position.x, axisGroup.position.y, axisGroup.position.z],
      quaternion: [
        axisGroup.quaternion.x,
        axisGroup.quaternion.y,
        axisGroup.quaternion.z,
        axisGroup.quaternion.w,
      ],
    };
  }

  /**
   * Get all frames
   */
  getAllFrames(): TFFrame[] {
    const frames: TFFrame[] = [];
    this.frameAxes.forEach((axisGroup, frameName) => {
      frames.push({
        name: frameName,
        position: [axisGroup.position.x, axisGroup.position.y, axisGroup.position.z],
        quaternion: [
          axisGroup.quaternion.x,
          axisGroup.quaternion.y,
          axisGroup.quaternion.z,
          axisGroup.quaternion.w,
        ],
      });
    });
    return frames;
  }

  /**
   * Get frame group
   */
  getFrameGroup(): THREE.Group {
    return this.frameGroup;
  }

  /**
   * Clear all frames
   */
  clear(): void {
    this.frameAxes.forEach((axisGroup, _) => {
      this.frameGroup.remove(axisGroup);
      axisGroup.traverse(child => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          child.material.dispose();
        } else if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        } else if (child instanceof THREE.Sprite) {
          child.material.dispose();
        }
      });
    });
    this.frameAxes.clear();
  }

  /**
   * Get frame count
   */
  getFrameCount(): number {
    return this.frameAxes.size;
  }
}
