// This contains all the events name & event args used to communicate through nodes

import { LocomotionMode } from "./lib/const.js";
import { MotorSpeed, MotorAngle } from "./types.js";

export type RoverCommand = {
  connected: boolean,
  motorsEnabled: boolean,
  locomotionMode: LocomotionMode,
  velocity: number,
  steering: number,
};

export type MotorCommand = {
  motorSpeeds: MotorSpeed,
  motorAngles: MotorAngle
};

// inspired from http://docs.ros.org/en/api/sensor_msgs/html/msg/Joy.html
export type ControlCommand = {
  axes: number[]; // inspired from joy
  buttons: number[];
};


export type EventsNameTypesMapping = {
  'roverCommand': RoverCommand
  'motorCommand': MotorCommand
  'controlCommand': ControlCommand
}