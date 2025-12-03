export type ServoArray<T> = [T, T, T, T, T, T];

export type MotorAngle = ServoArray<number>;
export type MotorSpeed = ServoArray<number>;

export type Coord3D = {
  x: number;
  y: number;
  z: number;
};

export type RoverOrientation = {
  roll: number;
  pitch: number;
  heading: number;
};
