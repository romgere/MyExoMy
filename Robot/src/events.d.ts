// This contains all the events name & event args used to communicate through nodes

import { LocomotionMode } from "./lib/const.js";
import { MotorVelocity, MotorAngle } from "./types.js";
export type RoverCommandEvent = {
  connected: boolean,
  motorsEnabled: boolean,
  locomotionMode: LocomotionMode,
  velocity: number,
  steering: number,
};

export type MotorCommandEvent = {
  motorSpeeds: MotorVelocity,
  motorAngles: MotorAngle
};


export type EventsNameTypesMapping = {
  'roverCommand': RoverCommandEvent
  'motorCommand': MotorCommandEvent
}