import type { ServoArray } from '@robot/shared/types.js';
import type { EventsTypesMapping } from '@robot/shared/events.js';
import { StreamCameraConfig } from './lib/stream-camera.ts';

// TODO: restrict to -100 to 100
export type DrivingCommand = number;

// 0(left) +90(forward) -90(backward)  +-180(right)
export type SteeringCommand = number;

type ServoConfig = {
  pins: ServoArray<number>;
  min: ServoArray<number>;
  neutral: ServoArray<number>;
  max: ServoArray<number>;
};

// Gyroscope & magnetometer config
type OrientationConfig = {
  // Magnetometer config
  hardironX: number;
  hardironY: number;
  hardironZ: number;

  // Inverse axes
  // Tweak this depending on gyro/magnetometer sensor orientation inside rover body
  inversePitch: boolean;
  inverseRoll: boolean;
  inverseHeading: boolean;

  // Axes deviation
  // Tweak this if HUD is not centered while rover on plane surface & oriented to magnetic north
  deviationPitch: number;
  deviationRoll: number;
  deviationHeading: number;
};

export type ExomyConfig = {
  drive: ServoConfig;
  steer: ServoConfig;
  camera?: Partial<StreamCameraConfig>;
  smsRecipient: string;
  gitHubUsername: string;
  sshTunnelAutoStart: boolean;
} & OrientationConfig;

export type ServiceWorkerMessage<Events extends EventsTypesMapping, Name extends keyof Events> = {
  name: Name;
  payload: Events[Name];
};

export type ServiceWorkerData = {
  config: ExomyConfig;
  serviceName: string;
};
