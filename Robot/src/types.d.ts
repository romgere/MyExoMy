
// TODO: restrict to -100 to 100
export type DrivingCommand = number;

// 0(left) +90(forward) -90(backward)  +-180(right)
export type SteeringCommand = number;

export type ServoArray<T> = [T, T, T, T, T, T];

export type MotorAngle = ServoArray<number>;
export type MotorVelocity = ServoArray<number>;

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

