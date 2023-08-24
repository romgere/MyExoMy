import path from 'path';

import type { EventsName } from '@robot/shared/events.js';
// 0 fl-||-fr 1
//      ||
// 2 cl-||-cr 3
// 4 rl====rr 5
export enum WheelPosition {
  FL = 0,
  FR = 1,
  CL = 2,
  CR = 3,
  RL = 4,
  RR = 5,
}

export const WheelPositions = [
  WheelPosition.FL,
  WheelPosition.FR,
  WheelPosition.CL,
  WheelPosition.CR,
  WheelPosition.RL,
  WheelPosition.RR,
];

export const WheelNames = ['FL', 'FR', 'CL', 'CR', 'RL', 'RR'];

// For most motors a pwm frequency of 50Hz is normal
export const pwmFrequency = 50.0; // Hz

export const configFilePath = path.resolve(process.cwd(), 'config/exomy.json');

export const httpServerPort = 3000;
export const httpServerCorsOrigin = '*';

// Rover "physical" settings
export const wheelX = 12.0;
export const wheelY = 20.0;
export const maxSteeringAngle = 45;
export const maxAngleChange = 30;

// Timing
export const motor_watchdog_timeout = 5000;
export const pi_sensor_update_interval = 500;
export const external_sensor_update_interval = 50;

// List rover event that are allowed to be sent by socket
export const socketAllowedCommand: EventsName[] = ['controlCommand', 'updateCameraSettings'];

// List rover event that are "proxified" to socker (sent to socket)
export const socketProxifiedEvents: EventsName[] = ['piSensor', 'externalSensor'];
