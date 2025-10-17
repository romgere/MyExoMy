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

// Any changes on port bellow will need to be "replicate" on `Docker/run_exomy.sh` file
export const httpServerPort = 3000;
export const videoServerPort = 3001;

// TODO secure connection
export const httpServerCorsOrigin = '*';

// Rover "physical" settings
export const rearAxeMeasure = {
  distance: 20, // distance from central axe (mm)
  width: 25.3, // awe width
};
export const frontAxeMeasure = {
  distance: 19.2, // distance from central axe (mm)
  width: 25.3, // awe width
};

export const maxSteeringAngle = 45;
export const maxAngleChange = 30;

// Timing
export const motor_watchdog_timeout = 5000;
export const motor_event_update_interval = 500;
export const pi_sensor_update_interval = 1000;
// Reading all sensor took ~10/15ms, too small value could lead to high latency rover commands
export const external_sensor_update_interval = 250;
// Define interval rover send GPS info to control app (data are read continuously from SIM7600E NMEA port)
export const gps_update_interval = 1000;

// SIM7600E Serial port (see `Docker/run_exomy.sh`)
export const sim7600e_gps_device = '/dev/ttyUSBGPS';
export const sim7600e_serial_at_device = '/dev/ttyS4G';

// List rover event that are allowed to be received from websocket (from command app)
export const socketAllowedCommand: EventsName[] = ['controlCommand', 'updateCameraSettings'];

// List rover event that are "proxified" to websocket (sent through websocket to control app)
export const socketProxifiedEvents: EventsName[] = [
  'piSensor',
  'externalSensor',
  'motorStatus',
  'gps',
];
