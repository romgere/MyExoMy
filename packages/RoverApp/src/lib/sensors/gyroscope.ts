// inspired from SEN-MPU6050_Manual (https://joy-it.net/files/files/Produkte/SEN-MPU6050/SEN-MPU6050_Beispielcode.zip)
import { getGyroY, getGyroX, getGyroZ } from '@robot/rover-app/helpers/gyro.js';
import { openSync } from 'i2c-bus';

import type { PromisifiedBus } from 'i2c-bus';

const gyro_addr = 0x68; // address of gyroscope module (SEN-MPU6050)
const acceleration_scale_factor = 16384.0; // scale factors of accelerometer

export default class GyroscopeSensor {
  i2cbus: PromisifiedBus;

  constructor() {
    this.i2cbus = openSync(1).promisifiedBus();
  }

  async init() {
    await this.i2cbus.writeByte(gyro_addr, 0x6b, 0);
  }

  async getTemperatureSensor() {
    const buffer = Buffer.alloc(2);
    await this.i2cbus.readI2cBlock(gyro_addr, 0x41, 2, buffer);

    const temperature = buffer.readInt16BE();

    return Number((temperature / 340 + 36.53).toFixed(1));
  }

  async getGyroSensor() {
    // reading accelerometer values
    const buffer = Buffer.alloc(6);

    await this.i2cbus.readI2cBlock(gyro_addr, 0x3b, 6, buffer);

    const accelX = buffer.readInt16BE();
    const accelY = buffer.readInt16BE(2);
    const accelZ = buffer.readInt16BE(4);

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
