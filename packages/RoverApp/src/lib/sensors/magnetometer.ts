// Inspired by https://github.com/adafruit/Adafruit_MMC56x3/blob/main/Adafruit_MMC56x3.cpp
import sleep from '@robot/rover-app/helpers/sleep.js';
import { openSync } from 'i2c-bus';
import logger from '@robot/rover-app/lib/logger.js';
import I2CRegister from '@robot/rover-app/helpers/i2c-register.js';

import type { PromisifiedBus } from 'i2c-bus';

const magneto_addr = 0x30; // address of magnetometer module (MMC5603)

const _MMC5603_CHIP_ID = 0x10;

const _MMC5603_OUT_X_L = 0x00; // Register that starts the mag data out
const _MMC5603_OUT_TEMP = 0x09; // Register that contains temp reading
const _MMC5603_PRODUCT_ID = 0x39; // Register that contains the part ID
const _MMC5603_STATUS_REG = 0x18; // Register address for device status
const _MMC5603_ODR_REG = 0x1a; // Output data rate register
const _MMC5603_CTRL_REG0 = 0x1b; // Register address for control 0
const _MMC5603_CTRL_REG1 = 0x1c; // Register address for control 1
const _MMC5603_CTRL_REG2 = 0x1d; // Register address for control 2

export default class MagnetometerSensor {
  i2cbus: PromisifiedBus;

  ctrl0_reg = new I2CRegister(magneto_addr, _MMC5603_CTRL_REG0);
  ctrl1_reg = new I2CRegister(magneto_addr, _MMC5603_CTRL_REG1);
  ctrl2_reg = new I2CRegister(magneto_addr, _MMC5603_CTRL_REG2);
  status_reg = new I2CRegister(magneto_addr, _MMC5603_STATUS_REG);

  temp_data = new I2CRegister(magneto_addr, _MMC5603_OUT_TEMP);
  odr_reg = new I2CRegister(magneto_addr, _MMC5603_ODR_REG);

  chip_id = new I2CRegister(magneto_addr, _MMC5603_PRODUCT_ID);

  odr_cache = 0;
  ctrl2_cache = 0;

  constructor() {
    this.i2cbus = openSync(1).promisifiedBus();
  }

  async init() {
    // make sure we're talking to the right chip
    if ((await this.chip_id.read()) != _MMC5603_CHIP_ID) {
      logger.error('No MMC56X3 detected');
      return false;
    }

    await this.reset();
  }

  // Resets the sensor to an initial state
  async reset() {
    await this.ctrl1_reg.write(0x80); // write only, set topmost bit
    await sleep(20);
    this.ctrl2_cache = 0;
    this.odr_cache = 0;
    await this.magnetSetReset();
    await this.setContinuousMode(false);
  }

  // Pulse large currents through the sense coils to clear any offset
  async magnetSetReset() {
    await this.ctrl0_reg.write(0x08); // turn on set bit
    await sleep(1);
    this.ctrl0_reg.write(0x10); // turn on reset bit
    await sleep(1);
  }

  async setContinuousMode(mode: boolean) {
    if (mode) {
      await this.ctrl0_reg.write(0x80); // turn on cmm_freq_en bit
      this.ctrl2_cache |= 0x10; // turn on cmm_en bit
    } else {
      this.ctrl2_cache &= ~0x10; // turn off cmm_en bit
    }
    await this.ctrl2_reg.write(this.ctrl2_cache);
  }

  get isContinuousMode() {
    return this.ctrl2_cache & 0x10;
  }

  // Gets the most recent sensor event
  async getEvent() {
    /* Read new data */
    if (!this.isContinuousMode) {
      await this.ctrl0_reg.write(0x01); // TM_M trigger

      while (!(await this.status_reg.readBit(6))) {
        await sleep(5);
      }
    }

    const buffer = Buffer.alloc(9);

    buffer[0] = _MMC5603_OUT_X_L;

    // read 8 bytes! TODO: refactor BusIORegister to allow multi-bytes register ?
    await this.i2cbus.i2cWrite(magneto_addr, 1, buffer);
    await this.i2cbus.i2cRead(magneto_addr, buffer.length, buffer);

    let x = (buffer[0] << 12) | (buffer[1] << 4) | (buffer[6] >> 4);
    let y = (buffer[2] << 12) | (buffer[3] << 4) | (buffer[7] >> 4);
    let z = (buffer[4] << 12) | (buffer[5] << 4) | (buffer[8] >> 4);

    // fix center offsets
    x -= 1 << 19;
    y -= 1 << 19;
    z -= 1 << 19;
    // scale to uT by LSB in datasheet
    x *= 0.00625;
    y *= 0.00625;
    z *= 0.00625;

    return { x, y, z };
  }

  async readTemperature() {
    if (this.isContinuousMode) {
      return -1;
    }

    await this.ctrl0_reg.write(0x02); // TM_T trigger

    while (!(await this.status_reg.readBit(7))) {
      await sleep(5);
    }

    // let temp = buffer.readInt8();
    let temp = await this.temp_data.read();
    temp *= 0.8; //  0.8*C / LSB
    temp -= 75; //  0 value is -75

    return temp;
  }

  async setDataRate(rate: number) {
    // only 0~255 and 1000 are valid, so just move any high rates to 1000
    if (rate > 255) {
      rate = 1000;
    }

    this.odr_cache = rate;

    if (rate == 1000) {
      await this.odr_reg.write(255);
      this.ctrl2_cache |= 0x80; // turn on hpower bit
      await this.ctrl2_reg.write(this.ctrl2_cache);
    } else {
      await this.odr_reg.write(rate);
      this.ctrl2_cache &= ~0x80; // turn off hpower bit
      await this.ctrl2_reg.write(this.ctrl2_cache);
    }
  }

  getDataRate() {
    return this.ctrl2_cache;
  }
}
