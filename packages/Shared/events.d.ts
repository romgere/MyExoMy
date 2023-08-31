// This contains all the events name & event args used to communicate through nodes
import { MotorSpeed, MotorAngle, Coord3D } from './types.js';
import type LocomotionMode from './locomotion-modes.js';
import type { CameraConfig } from './camera.js';
import type { IWData } from './iwconfig.js';

export type RoverCommand = {
  connected: boolean;
  motorsEnabled: boolean;
  locomotionMode: LocomotionMode;
  velocity: number;
  steering: number;
};

export type MotorCommand = {
  motorSpeeds: MotorSpeed;
  motorAngles: MotorAngle;
};

export type ControlCommand = {
  axes: [number, number];
  locomotionMode: LocomotionMode;
  toggleMotors: boolean;
};

export type PiSensorEvent = {
  underVoltage: boolean;
  armFreqCapped: boolean;
  throttled: boolean;
  softTemperatureLimit: boolean;
  underVoltageOccurred: boolean;
  armFreqCappedOccurred: boolean;
  throttledOccurred: boolean;
  softTemperatureLimitOccurred: boolean;
  temperature: number;
  iwData: IWData;
};

export type ProximitySensorPosition = 'RR' | 'RL' | 'FR' | 'FL';

export type ExternalSensorEvent = {
  gyro: {
    gyro: Coord3D;
    accel: Coord3D;
    temperature: number;
  };
  magneto: {
    data: Coord3D;
    temperature: number;
  };
  lidar: {
    temperature: number;
    distance: number;
    flux: number;
    error: number;
  };
  proximity: Record<ProximitySensorPosition, number>;
};


export type EventsTypesMapping = {
  roverCommand: [cmd: RoverCommand];
  motorCommand: [cmd: MotorCommand];
  controlCommand: [cmd: ControlCommand];
  updateCameraSettings: [cmd: CameraConfig];
  piSensor: [data: PiSensorEvent];
  externalSensor: [data: ExternalSensorEvent];
};
export type EventsName = keyof EventsTypesMapping;

export type EventsTypesHandlersMapping = EventsTypesToFunctionMapping<EventsTypesMapping>;

type EventsTypesToFunctionMapping<T extends Record<string, unknown[]>> = {
  [Property in keyof T]: (...args: T[Property]) => void;
};
