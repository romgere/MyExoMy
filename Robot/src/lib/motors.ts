import sleep from '@exomy/robot/helpers/sleep.js';
import asyncPca9685 from '@exomy/robot/helpers/async-pca-9685.js';
import { WheelPosition } from './const.js';

import type { MotorAngle, MotorSpeed, ServoArray } from '@exomy/event-types/types.js';
import type { ExomyConfig } from '@exomy/robot/types.js';
import type { Pca9685Driver } from 'pca9685';

// Motors class contains all functions to control the steering and driving
class Motors {
  motorsSettings: ExomyConfig;
  pwm?: Pca9685Driver;

  // Motor commands are assuming positiv=driving_forward, negative=driving_backwards.
  // The driving direction of the left side has to be inverted for this to apply to all wheels.
  wheelDirections: ServoArray<1 | -1> = [-1, 1, -1, 1, -1, 1];

  constructor(motorsSettings: ExomyConfig) {
    this.motorsSettings = motorsSettings;
  }

  async init() {
    this.pwm = await asyncPca9685();

    // Set steering motors to neutral values (straight)
    this.stopMotors();

    await this.wiggle();
  }

  async wiggle() {
    if (!this.pwm) {
      return;
    }

    const { steer: steerSettings } = this.motorsSettings;

    await sleep(100);
    this.pwm.setPulseRange(
      steerSettings.pins[0],
      0,
      steerSettings.neutral[0] + (steerSettings.max[0] - steerSettings.neutral[0]) * 0.5,
    );
    await sleep(100);
    this.pwm.setPulseRange(
      steerSettings.pins[1],
      0,
      steerSettings.neutral[1] + (steerSettings.max[1] - steerSettings.neutral[1]) * 0.5,
    );
    await sleep(500);
    this.pwm.setPulseRange(
      steerSettings.pins[0],
      0,
      steerSettings.neutral[0] - (steerSettings.neutral[0] - steerSettings.min[0]) * 0.5,
    );
    await sleep(100);
    this.pwm.setPulseRange(
      steerSettings.pins[1],
      0,
      steerSettings.neutral[1] - (steerSettings.neutral[1] - steerSettings.min[1]) * 0.5,
    );
    await sleep(300);
    this.pwm.setPulseRange(steerSettings.pins[0], 0, steerSettings.neutral[0]);
    await sleep(100);
    this.pwm.setPulseRange(steerSettings.pins[1], 0, steerSettings.neutral[1]);
    await sleep(300);
  }

  setSteering(steeringCommand: MotorAngle) {
    if (!this.pwm) {
      return;
    }

    const { steer: steerSettings } = this.motorsSettings;

    for (const wheel in WheelPosition) {
      const range =
        steeringCommand[wheel] > 0
          ? steerSettings.max[wheel] - steerSettings.neutral[wheel]
          : steerSettings.neutral[wheel] - steerSettings.min[wheel];

      const dutyCycle = steerSettings.neutral[wheel] + (steeringCommand[wheel] / 90) * range;

      this.pwm.setPulseRange(steerSettings.pins[wheel], 0, dutyCycle);
    }
  }

  setDriving(drivingCommand: MotorSpeed) {
    if (!this.pwm) {
      return;
    }

    const { drive: driveSettings } = this.motorsSettings;

    for (const wheel in WheelPosition) {
      // Get the range between neutral & max when drivingCommand is pos for regular direction
      // or when drivingCommand is neg for inverted direction
      const hightRange =
        (drivingCommand[wheel] > 0 && this.wheelDirections[wheel] === 1) ||
        (drivingCommand[wheel] < 0 && this.wheelDirections[wheel] === -1);

      const range = hightRange
        ? driveSettings.max[wheel] - driveSettings.neutral[wheel]
        : driveSettings.neutral[wheel] - driveSettings.min[wheel];

      const dutyCycle =
        driveSettings.neutral[wheel] +
        (drivingCommand[wheel] / 100) * range * this.wheelDirections[wheel];

      this.pwm.setPulseRange(driveSettings.pins[wheel], 0, dutyCycle);
    }
  }

  // Set driving wheels to neutral position to stop them
  stopMotors() {
    if (!this.pwm) {
      return;
    }

    const { drive: driveSettings } = this.motorsSettings;

    for (const wheel in WheelPosition) {
      this.pwm.setPulseRange(driveSettings.pins[wheel], 0, driveSettings.neutral[wheel]);
    }
  }
}

export default Motors;
