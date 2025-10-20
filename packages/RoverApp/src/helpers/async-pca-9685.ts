import { openSync } from 'i2c-bus';
import { Pca9685Driver } from 'pca9685';
import { pwmFrequency } from '@robot/rover-app/const.js';
import os from 'os';
import type { Pca9685Options } from 'pca9685';

export default function asyncPca9685(
  options: Partial<Pca9685Options> = {},
): Promise<Pca9685Driver> {
  // If not on raspberry, mock Pca 9685 drivers (script dev/debug mode on "regular" PC)
  if (os.arch() !== 'arm') {
    return Promise.resolve(new MockedPca9685Driver() satisfies Pca9685Options);
  }

  return new Promise((resolve, reject) => {
    const pwm = new Pca9685Driver(
      {
        i2c: openSync(1),
        address: 0x40,
        debug: false,
        frequency: pwmFrequency,
        ...options,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function (err: any) {
        if (err) {
          reject(err);
        } else {
          resolve(pwm);
        }
      },
    );
  });
}

class MockedPca9685Driver {
  dispose(): void {
    if (process.env.DEBUG_PCA9685_MOCK) {
      console.log('PCA9685 => dispose()');
    }
  }

  setPulseRange(
    channel: number,
    onStep: number,
    offStep: number,
    // eslint-disable-next-line
    _callback?: (error: any) => any,
  ): void {
    if (process.env.DEBUG_PCA9685_MOCK) {
      console.log('PCA9685 => setPulseRange(', channel, onStep, offStep, ')');
    }
  }

  setPulseLength(
    channel: number,
    pulseLengthMicroSeconds: number,
    onStep?: number,
    // eslint-disable-next-line
    _callback?: (error: any) => any,
  ): void {
    if (process.env.DEBUG_PCA9685_MOCK) {
      console.log('PCA9685 => setPulseLength(', channel, pulseLengthMicroSeconds, onStep, ')');
    }
  }

  setDutyCycle(
    channel: number,
    dutyCycleDecimalPercentage: number,
    onStep?: number,
    // eslint-disable-next-line
    _callback?: (error: any) => any,
  ): void {
    if (process.env.DEBUG_PCA9685_MOCK) {
      console.log('PCA9685 => setDutyCycle(', channel, dutyCycleDecimalPercentage, onStep, ')');
    }
  }

  // eslint-disable-next-line
  allChannelsOff(_callback?: (error: any) => any): void {
    if (process.env.DEBUG_PCA9685_MOCK) {
      console.log('PCA9685 => callback()');
    }
  }

  // eslint-disable-next-line
  channelOff(channel: number, _callback?: (error: any) => any): void {
    if (process.env.DEBUG_PCA9685_MOCK) {
      console.log('PCA9685 => channelOff(', channel, ')');
    }
  }

  // eslint-disable-next-line
  channelOn(channel: number, _callback?: (error: any) => any): void {
    if (process.env.DEBUG_PCA9685_MOCK) {
      console.log('PCA9685 => channelOn(', channel, ')');
    }
  }
}
