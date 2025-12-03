// inspired from SEN-MPU6050_Manual (https://joy-it.net/files/files/Produkte/SEN-MPU6050/SEN-MPU6050_Beispielcode.zip)
import { openSync } from 'i2c-bus';

import type { PromisifiedBus } from 'i2c-bus';

const gyro_addr = 0x68; // address of gyroscope module (SEN-MPU6050)

const scale_gyroscope = 131.0; // scale factors of gyroscope
const scale_acceleration = 16384.0; // scale factors of gyroscope

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

  async getAccelerometerValues() {
    let high = await this.i2cbus.readByte(gyro_addr, 0x3b);
    let low = await this.i2cbus.readByte(gyro_addr, 0x3b + 1);

    let x = (high << 8) + low;
    if (x >= 0x8000) {
      x = -(65535 - x + 1);
    }

    high = await this.i2cbus.readByte(gyro_addr, 0x3d);
    low = await this.i2cbus.readByte(gyro_addr, 0x3d + 1);

    let y = (high << 8) + low;
    if (y >= 0x8000) {
      y = -(65535 - y + 1);
    }

    high = await this.i2cbus.readByte(gyro_addr, 0x3f);
    low = await this.i2cbus.readByte(gyro_addr, 0x3f + 1);

    let z = (high << 8) + low;
    if (z >= 0x8000) {
      z = -(65535 - z + 1);
    }

    return {
      x: x / scale_acceleration, // g
      y: y / scale_acceleration, // g
      z: z / scale_acceleration, // g
    };
  }

  async getGyroscopeValues() {
    let high = await this.i2cbus.readByte(gyro_addr, 0x43);
    let low = await this.i2cbus.readByte(gyro_addr, 0x43 + 1);

    let x = (high << 8) + low;
    if (x >= 0x8000) {
      x = -(65535 - x + 1);
    }

    high = await this.i2cbus.readByte(gyro_addr, 0x45);
    low = await this.i2cbus.readByte(gyro_addr, 0x45 + 1);

    let y = (high << 8) + low;
    if (y >= 0x8000) {
      y = -(65535 - y + 1);
    }

    high = await this.i2cbus.readByte(gyro_addr, 0x47);
    low = await this.i2cbus.readByte(gyro_addr, 0x47 + 1);

    let z = (high << 8) + low;
    if (z >= 0x8000) {
      z = -(65535 - z + 1);
    }

    return {
      x: ((x / scale_gyroscope) * Math.PI) / 180, // Rad/s
      y: ((y / scale_gyroscope) * Math.PI) / 180, // Rad/s
      z: ((z / scale_gyroscope) * Math.PI) / 180, // Rad/s
    };
  }
}
