export enum Mirror {
  NONE = 0,
  VERT = 1,
  HORZ = 2,
  BOTH = 3,
}

interface CameraSettings {
  width: number;
  height: number;
  fps: number;
  quality: number;
  rotation: 0 | 90 | 180 | 270;
  mirror: Mirror;
}
