import { openSync } from 'i2c-bus';
import { Pca9685Driver } from 'pca9685';
import { pwmFrequency } from '@robot/rover-app/const.js';

import type { Pca9685Options } from 'pca9685';

export default function asyncPca9685(
  options: Partial<Pca9685Options> = {},
): Promise<Pca9685Driver> {
  return new Promise((resolve, reject) => {
    const pwm = new Pca9685Driver(
      {
        i2c: openSync(1),
        address: 0x40,
        debug: false,
        frequency: pwmFrequency,
        ...options,
      },
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(pwm);
        }
      },
    );
  });
}
