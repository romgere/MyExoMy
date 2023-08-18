// This contains all the events name & event args used to communicate through nodes
import { MotorSpeed, MotorAngle } from './types.js';
import { LocomotionMode } from './locomotion-modes.js';
import type { CameraConfig } from './camera.js';

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
  buttons: {
    locomotionMode1: boolean;
    locomotionMode2: boolean;
    locomotionMode3: boolean;
    locomotionMode4: boolean;
    toggleMotors: boolean;
  };
};

export type EventsNameTypesMapping = {
  roverCommand: (cmd: RoverCommand) => void;
  motorCommand: (cmd: MotorCommand) => void;
  controlCommand: (cmd: ControlCommand) => void;
  updateCameraSettings: (cmd: CameraConfig) => void;
};
