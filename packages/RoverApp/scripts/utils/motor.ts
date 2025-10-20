import type { Pca9685Driver } from 'pca9685';
import wait from './wait.ts';
import { WheelPosition, configFilePath } from '@robot/rover-app/const.ts';
import { ExomyConfig } from '@robot/rover-app/types.js';
import fs from 'fs-extra';

export type MotorType = 'driving' | 'steering';
export type PWMValueType = 'min' | 'max' | 'neutral';

export async function wiggleMotor(pwm: Pca9685Driver, pin: number) {
  pwm.setPulseRange(pin, 0, 200);
  await wait(1000);
  pwm.setPulseRange(pin, 0, 400);
  await wait(1000);
  pwm.setPulseRange(pin, 0, 307);
  await wait(500);
  pwm.setPulseRange(pin, 0, 0);
}

export const wheelPositionLabels: Record<WheelPosition, string> = {
  [WheelPosition.FL]: 'Front left',
  [WheelPosition.FR]: 'Front right',
  [WheelPosition.CL]: 'Center left',
  [WheelPosition.CR]: 'Center right',
  [WheelPosition.RL]: 'Rear left',
  [WheelPosition.RR]: 'Rear right',
};

export function getMotorPin(
  motorType: MotorType,
  position: WheelPosition,
  config: ExomyConfig,
): number {
  return config[motorType === 'driving' ? 'drive' : 'steer'].pins[position];
}

export function getMotorPWMValue(
  motorType: MotorType,
  position: WheelPosition,
  pwmValueType: PWMValueType,
  config: ExomyConfig,
): number {
  return config[motorType === 'driving' ? 'drive' : 'steer'][pwmValueType][position];
}

export function setMotorPWMValue(
  newValue: number,
  motorType: MotorType,
  position: WheelPosition,
  pwmValueType: PWMValueType,
  config: ExomyConfig,
) {
  config[motorType === 'driving' ? 'drive' : 'steer'][pwmValueType][position] = newValue;
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}
