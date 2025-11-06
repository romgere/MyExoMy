import { AwbMode, ExposureMode, Flip, Rotation } from '@robot/shared/camera';

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
export const defaultFps = 12;
export const defaultFlip = Flip.None;
export const defaultRotation = Rotation.Rotate0;
export const defaultExposure = ExposureMode.Normal;
export const defaultAwb = AwbMode.Auto;

type RangeSetting = {
  min: string;
  max: string;
  default: number;
  label: string;
  unit?: string;
  step?: number;
  factor?: number;
};

export const genericAdvancedRangeSettings: Record<string, RangeSetting> = {
  quality: {
    min: '1',
    max: '100',
    default: 50,
    label: 'Quality',
  },
  sharpness: { min: '0', max: '200', default: 0, label: 'Sharpness', factor: 0.01 },
  contrast: { min: '0', max: '200', default: 100, label: 'Contrast', factor: 0.01 },
  brightness: { min: '-100', max: '100', default: 0, label: 'Brightness', factor: 0.01 },
  saturation: { min: '0', max: '100', default: 0, label: 'Saturation', factor: 0.01 },
  exposureCompensation: { min: '-10', max: '10', default: 0, label: 'Exposure compensation' },
};
