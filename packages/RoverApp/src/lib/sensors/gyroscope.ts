// inspired from SEN-MPU6050_Manual (https://joy-it.net/files/files/Produkte/SEN-MPU6050/SEN-MPU6050_Beispielcode.zip)
import { readWord, writeByte } from '@robot/rover-app/helpers/i2c-promise.js';
import { getGyroY, getGyroX, getGyroZ } from '@robot/rover-app/helpers/gyro.js';
import { openSync } from 'i2c-bus';

import type { I2CBus } from 'i2c-bus';

const gyro_addr = 0x68; // address of gyroscope module (SEN-MPU6050)
const acceleration_scale_factor = 16384.0; // scale factors of accelerometer

export default class GyroscopeSensor {
  i2cbus: I2CBus;

  constructor() {
    this.i2cbus = openSync(1);
  }

  async init() {
    await writeByte(this.i2cbus, gyro_addr, 0x6b, 0);
  }

  async getTemperatureSensor() {
    const temperature = await readWord(this.i2cbus, gyro_addr, 0x41);
    return Number((temperature / 340 + 36.53).toFixed(1));
  }

  async getGyroSensor() {
    // reading accelerometer values
    const accelX = await readWord(this.i2cbus, gyro_addr, 0x3b);
    const accelY = await readWord(this.i2cbus, gyro_addr, 0x3d);
    const accelZ = await readWord(this.i2cbus, gyro_addr, 0x3f);

    // scaled accelerometer values
    const accelXScaled = accelX / acceleration_scale_factor;
    const accelYScaled = accelY / acceleration_scale_factor;
    const accelZScaled = accelZ / acceleration_scale_factor;

    return {
      x: getGyroY(accelXScaled, accelYScaled, accelZScaled),
      y: getGyroX(accelXScaled, accelYScaled, accelZScaled),
      z: getGyroZ(accelXScaled, accelYScaled, accelZScaled),
    };
  }
}
