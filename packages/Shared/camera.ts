export enum Rotation {
  Rotate0 = 0,
  Rotate90 = 90,
  Rotate180 = 180,
  Rotate270 = 270,
}

export enum Flip {
  None = 'none',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Both = 'both',
}

export enum ExposureMode {
  Normal = 'normal',
  Sport = 'sport',
  Long = 'long',
}

export enum AwbMode {
  Auto = 'auto',
  Incandescent = 'incandescent',
  Tungsten = 'tungsten',
  Fluorescent = 'fluorescent',
  Indoor = 'indoor',
  Daylight = 'daylight',
  Cloudy = 'cloudy',
  Custom = 'custom',
}

export enum SensorMode {
  AutoSelect = 0,
  Mode1 = 1,
  Mode2 = 2,
  Mode3 = 3,
  Mode4 = 4,
  Mode5 = 5,
  Mode6 = 6,
  Mode7 = 7,
}

export interface CameraConfig {
  width?: number;
  height?: number;
  rotation?: Rotation;
  flip?: Flip;
  quality?: number;
  fps?: number;
  sensorMode?: SensorMode;
  shutter?: number;
  sharpness?: number;
  contrast?: number;
  brightness?: number;
  saturation?: number;
  exposureCompensation?: number;
  exposureMode?: ExposureMode;
  awbMode?: AwbMode;
  analogGain?: number;
  digitalGain?: number;
}
