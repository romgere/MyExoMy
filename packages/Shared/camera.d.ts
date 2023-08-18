// Types above are copied from 'pi-camera-connect' package
// We don't want to use this package here given, current package is used by ember app
// and 'pi-camera-connect' package require an arduino arch to be installed

export declare enum Rotation {
  Rotate0 = 0,
  Rotate90 = 90,
  Rotate180 = 180,
  Rotate270 = 270,
}

export declare enum Flip {
  None = 'none',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Both = 'both',
}

export declare enum ExposureMode {
  Off = 'off',
  Auto = 'auto',
  Night = 'night',
  NightPreview = 'nightpreview',
  Backlight = 'backlight',
  Spotlight = 'spotlight',
  Sports = 'sports',
  Snow = 'snow',
  Beach = 'beach',
  VeryLong = 'verylong',
  FixedFps = 'fixedfps',
  AntiShake = 'antishake',
  Fireworks = 'fireworks',
}
export declare enum AwbMode {
  Off = 'off',
  Auto = 'auto',
  Sun = 'sun',
  Cloud = 'cloud',
  Shade = 'shade',
  Tungsten = 'tungsten',
  Fluorescent = 'fluorescent',
  Incandescent = 'incandescent',
  Flash = 'flash',
  Horizon = 'horizon',
  GreyWorld = 'greyworld',
}

export declare enum SensorMode {
  AutoSelect = 0,
  Mode1 = 1,
  Mode2 = 2,
  Mode3 = 3,
  Mode4 = 4,
  Mode5 = 5,
  Mode6 = 6,
  Mode7 = 7,
}

export type CameraConfig = {
  width?: number;
  height?: number;
  rotation?: Rotation;
  flip?: Flip;
  bitRate?: number;
  fps?: number;
  sensorMode?: SensorMode;
  shutter?: number;
  sharpness?: number;
  contrast?: number;
  brightness?: number;
  saturation?: number;
  iso?: number;
  exposureCompensation?: number;
  exposureMode?: ExposureMode;
  awbMode?: AwbMode;
  analogGain?: number;
  digitalGain?: number;
};
