// This contains all the events name & event args used to communicate through nodes
import { MotorSpeed, MotorAngle } from './types.js';
import { LocomotionMode } from './locomotion-modes.js';

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
    toggleMotors: boolean;
  };
};

export type EventsNameTypesMapping = {
  roverCommand: RoverCommand;
  motorCommand: MotorCommand;
  controlCommand: ControlCommand;
};
