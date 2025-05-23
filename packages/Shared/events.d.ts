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

export type MotorStatus = MotorCommand;

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
  // External command (received from control app)
  controlCommand: [cmd: ControlCommand]; // External command received from control center to move the rover
  updateCameraSettings: [cmd: CameraConfig]; // External command received from control app to update camera settings

  // Internal event (live only inside rover-app)
  roverCommand: [cmd: RoverCommand]; // Internal event sent by control service to rover service
  motorCommand: [cmd: MotorCommand]; // Internal event sent by rover service to motor service

  // External event (send to control app)
  motorStatus: [data: MotorStatus]; // External event sent by motor service to control App with motors status
  piSensor: [data: PiSensorEvent]; // External event sent by pi-sensor service to control app
  externalSensor: [data: ExternalSensorEvent]; // External event sent by external-sensor service to control app
};
export type EventsName = keyof EventsTypesMapping;

export type EventsTypesHandlersMapping = EventsTypesToFunctionMapping<EventsTypesMapping>;

type EventsTypesToFunctionMapping<T extends Record<string, unknown[]>> = {
  [Property in keyof T]: (...args: T[Property]) => void;
};
