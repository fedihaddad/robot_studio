// Type definitions for ros3d and related packages
declare module 'ros3d' {
  import * as THREE from 'three';
  import ROSLIB from 'roslib';

  export interface ViewerOptions {
    divID: string;
    width?: number;
    height?: number;
    antialias?: boolean;
    background?: number;
  }

  export class Viewer {
    constructor(options: ViewerOptions);
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    dispose(): void;
  }

  export interface UrdfClientOptions {
    ros: ROSLIB.Ros;
    tfClient: ROSLIB.TFClient;
    path: string;
    rootObject: THREE.Object3D;
    loader?: any;
    param?: string;
  }

  export class UrdfClient {
    constructor(options: UrdfClientOptions);
    on(event: string, callback: (error?: any) => void): void;
  }

  export const COLLADA_LOADER_0: any;
}

declare module 'roslib' {
  export interface RosOptions {
    url: string;
  }

  export class Ros {
    constructor(options: RosOptions);
    isConnected: boolean;
    on(event: 'connection' | 'error' | 'close', callback: (error?: any) => void): void;
    close(): void;
  }

  export interface TFClientOptions {
    ros: Ros;
    angularThres: number;
    rate: number;
  }

  export class TFClient {
    constructor(options: TFClientOptions);
  }
}
