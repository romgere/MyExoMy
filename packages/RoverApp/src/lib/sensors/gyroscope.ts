// inspired from SEN-MPU6050_Manual (https://joy-it.net/files/files/Produkte/SEN-MPU6050/SEN-MPU6050_Beispielcode.zip)
import { openSync } from 'i2c-bus';

import type { PromisifiedBus } from 'i2c-bus';

const gyro_addr = 0x68; // address of gyroscope module (SEN-MPU6050)

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

  // reading accelerometer values
  async getAccelerometerValues() {
    return await this.readValues(0x3b);
  }

  // reading gyroscrope values
  async getGyroscopeValues() {
    return await this.readValues(0x43);
  }

  private async readValues(command: number) {
    const buffer = Buffer.alloc(6);
    await this.i2cbus.readI2cBlock(gyro_addr, command, 6, buffer);

    return {
      x: buffer.readInt16BE(),
      y: buffer.readInt16BE(2),
      z: buffer.readInt16BE(4),
    };
  }
}
