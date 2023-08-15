import type { ServoArray } from '@robot/shared/types.js';

// TODO: restrict to -100 to 100
export type DrivingCommand = number;

// 0(left) +90(forward) -90(backward)  +-180(right)
export type SteeringCommand = number;

type ServoConfig = {
  pins: ServoArray<number>;
  min: ServoArray<number>;
  neutral: ServoArray<number>;
  max: ServoArray<number>;
};

export type ExomyConfig = {
  drive: ServoConfig;
  steer: ServoConfig;
};
