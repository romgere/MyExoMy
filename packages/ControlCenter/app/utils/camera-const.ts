import type { AwbMode, ExposureMode, Flip, Rotation } from '@robot/shared/camera';

export type CameraResolution = {
  width: number;
  height: number;
  aspect: string;
};

export const resolutions: Record<string, CameraResolution> = {
  '640x480': { width: 640, height: 480, aspect: '4:3' },
  '960x720': { width: 960, height: 720, aspect: '4:3' },
  '1280x720': { width: 1280, height: 720, aspect: '16:9' },
  '1440x1080': { width: 1440, height: 1080, aspect: '4:3' },
  '1920x1080': { width: 1920, height: 1080, aspect: '16:9' },
  '1640x922': { width: 1640, height: 922, aspect: '16:9' },
  '1640x1232': { width: 1640, height: 1232, aspect: '4:3' },
  '3280x2464': { width: 3280, height: 2464, aspect: '4:3' },
};

export const defaultResolution = '1440x1080';
export const defaultFps = 30;
export const defaultFlip: Flip = 'none' as Flip;
export const defaultRotation: Rotation = 0;
export const defaultExposure: ExposureMode = 'auto' as ExposureMode;
export const defaultAwb: AwbMode = 'auto' as AwbMode;
