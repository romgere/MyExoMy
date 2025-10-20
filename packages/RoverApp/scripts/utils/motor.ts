import type { Pca9685Driver } from 'pca9685';
import wait from './wait.ts';
import { WheelPosition } from '@robot/rover-app/const.ts';

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
