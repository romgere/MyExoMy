import path from 'path';

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

export const motor_watchdog_timeout = 5000;
