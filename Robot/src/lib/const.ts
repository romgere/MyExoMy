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

export enum LocomotionMode {
  ACKERMANN = 'ACKERMANN',
  POINT_TURN = 'POINT_TURN',
  CRABBING = 'CRABBING',
}

// For most motors a pwm frequency of 50Hz is normal
export const pwmFrequency = 50.0; // Hz

export const configFilePath = path.resolve(process.cwd(), 'config/exomy.json');