import type { ServoArray } from '@robot/shared/types.js';
import type { StreamOptions } from 'pi-camera-connect';

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

export type CameraConfig = Partial<Exclude<StreamOptions, 'codec'>>;

export type ExomyConfig = {
  drive: ServoConfig;
  steer: ServoConfig;
  camera?: CameraConfig;
  smsRecipient: string;
};

import type { EventsTypesMapping } from '@robot/shared/events.js';

export type ServiceWorkerMessage<Events extends EventsTypesMapping, Name extends keyof Events> = {
  name: Name;
  payload: Events[Name];
};

export type ServiceWorkerData = {
  config: ExomyConfig;
  serviceName: string;
};
