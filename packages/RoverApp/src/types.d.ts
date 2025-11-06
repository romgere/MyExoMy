import type { ServoArray } from '@robot/shared/types.js';
import type { EventsTypesMapping } from '@robot/shared/events.js';
import type { CameraConfig } from '@robot/shared/camera.js';

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

export type ExomyConfig = {
  drive: ServoConfig;
  steer: ServoConfig;
  camera?: Partial<CameraConfig>;
  smsRecipient: string;
  gitHubUsername: string;
  sshTunnelAutoStart: boolean;
};

export type ServiceWorkerMessage<Events extends EventsTypesMapping, Name extends keyof Events> = {
  name: Name;
  payload: Events[Name];
};

export type ServiceWorkerData = {
  config: ExomyConfig;
  serviceName: string;
};
