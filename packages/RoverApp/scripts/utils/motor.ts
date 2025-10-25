import type { Pca9685Driver } from 'pca9685';
import wait from './wait.ts';
import { WheelPosition } from '@robot/rover-app/const.ts';
import { ExomyConfig } from '@robot/rover-app/types.js';
import { pwmFrequency } from '@robot/rover-app/const.js';
import writeConfig from '@robot/rover-app/helpers/write-config.ts';

// The cycle is the inverted frequency converted to milliseconds
const cycle = (1 / pwmFrequency) * 1000; // ms

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

export const motorTypeSelectItems: { value: MotorType; label: string }[] = [
  {
    value: 'driving',
    label: 'Driving motor - 360° servo',
  },
  {
    value: 'steering',
    label: 'Steering motor - 180° servo',
  },
];

export const motorPositionSelectItems: { value: WheelPosition; label: string }[] = [
  { value: WheelPosition.FL, label: wheelPositionLabels[WheelPosition.FL] },
  { value: WheelPosition.FR, label: wheelPositionLabels[WheelPosition.FR] },
  { value: WheelPosition.CL, label: wheelPositionLabels[WheelPosition.CL] },
  { value: WheelPosition.CR, label: wheelPositionLabels[WheelPosition.CR] },
  { value: WheelPosition.RL, label: wheelPositionLabels[WheelPosition.RL] },
  { value: WheelPosition.RR, label: wheelPositionLabels[WheelPosition.RR] },
];

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
  writeConfig(config);
}

export function resetMotorPWMValue(
  motorType: MotorType,
  position: WheelPosition,
  pwmValueType: PWMValueType,
  config: ExomyConfig,
  pwm: Pca9685Driver,
) {
  const pin = config[motorType === 'driving' ? 'drive' : 'steer'].pins[position];
  const pwn = config[motorType === 'driving' ? 'drive' : 'steer'].neutral[position];
  pwm.setPulseRange(pin, 0, pwn);
}

export async function testMotor(
  motorType: MotorType,
  position: WheelPosition,
  config: ExomyConfig,
  pwm: Pca9685Driver,
) {
  const pin = config[motorType === 'driving' ? 'drive' : 'steer'].pins[position];

  const minT = 0.5; // ms
  const maxT = 2.5; // ms
  const midT = minT + maxT / 2;

  // *_dc is the percentage of a cycle the signal is on
  const minDc = minT / cycle;
  const maxDc = maxT / cycle;
  const midDc = midT / cycle;

  const dcList = [minDc, midDc, maxDc, midDc, minDc, midDc, maxDc];

  for (const dc of dcList) {
    pwm.setPulseRange(pin, 0, dc * 4096);
    await wait(500);
  }

  pwm.setPulseRange(pin, 0, 0);
}
