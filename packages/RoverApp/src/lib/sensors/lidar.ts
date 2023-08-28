// https://github.com/budryerson/TFLuna-I2C/tree/master/src
import { openSync } from 'i2c-bus';
import I2CRegister from '@robot/rover-app/helpers/i2c-register.js';

import type { PromisifiedBus } from 'i2c-bus';

const lidar_addr = 0x10; // address of lidar module (LiDAR TF-LUNA)

/* eslint-disable @typescript-eslint/no-unused-vars */
// Register Names and Numbers
const TFL_DIST_LO = 0x00; //R Unit: cm
const TFL_DIST_HI = 0x01; //R
const TFL_FLUX_LO = 0x02; //R
const TFL_FLUX_HI = 0x03; //R
const TFL_TEMP_LO = 0x04; //R Unit: 0.01 Celsius
const TFL_TEMP_HI = 0x05; //R
const TFL_TICK_LO = 0x06; //R Timestamp
const TFL_TICK_HI = 0x07; //R
const TFL_ERR_LO = 0x08; //R
const TFL_ERR_HI = 0x09; //R
const TFL_VER_REV = 0x0a; //R
const TFL_VER_MIN = 0x0b; //R
const TFL_VER_MAJ = 0x0c; //R
/* eslint-enable @typescript-eslint/no-unused-vars */

const TFL_SERIAL_NUM = 0x10; //R

const TFL_SAVE_SETTINGS = 0x20; //W -- Write 0x01 to save
const TFL_SOFT_RESET = 0x21; //W -- Write 0x02 to reboot.
// Lidar not accessible during few seconds,
// then register value resets automatically
const TFL_SET_I2C_ADDR = 0x22; //W/R -- Range 0x08,0x77.
// Must reboot to take effect.
const TFL_SET_TRIG_MODE = 0x23; //W/R -- 0-continuous, 1-trigger
const TFL_TRIGGER = 0x24; //W  --  1-trigger once
const TFL_DISABLE = 0x25; //W/R -- 0-disable, 1-enable
const TFL_FPS_LO = 0x26; //W/R -- lo byte
const TFL_FPS_HI = 0x27; //W/R -- hi byte
const TFL_HARD_RESET = 0x29; //W  --  1-restore factory settings

/////// FPS (Low Power Mode) ///////
export const FPS_1 = 0x01;
export const FPS_2 = 0x02;
export const FPS_3 = 0x03;
export const FPS_4 = 0x04;
export const FPS_5 = 0x05;
export const FPS_6 = 0x06;
export const FPS_7 = 0x07;
export const FPS_8 = 0x08;
export const FPS_9 = 0x09;
export const FPS_10 = 0x0a;

////// FPS (High Power Mode) /////
export const FPS_35 = 0x23;
export const FPS_50 = 0x32;
export const FPS_100 = 0x64;
export const FPS_125 = 0x7d;
export const FPS_250 = 0xfa;

export const TFL_DEF_FPS = FPS_100; // default frame-rate = 100fps

// Error Status Condition definitions
export enum TFL_STATUS {
  TFL_OK = 0, // no error
  TFL_WEAK = 10, // Signal Strength ≤ 100
  TFL_STRONG = 11, // Signal Strength saturation
  TFL_FLOOD = 12, // Ambient Light saturation
}

export default class GyroscopeSensor {
  i2cbus: PromisifiedBus;

  save_settings_reg = new I2CRegister(lidar_addr, TFL_SAVE_SETTINGS);
  soft_reset_reg = new I2CRegister(lidar_addr, TFL_SOFT_RESET);
  set_i2c_addr_reg = new I2CRegister(lidar_addr, TFL_SET_I2C_ADDR);
  disable_reg = new I2CRegister(lidar_addr, TFL_DISABLE);
  fps_lo_reg = new I2CRegister(lidar_addr, TFL_FPS_LO);
  fps_hi_reg = new I2CRegister(lidar_addr, TFL_FPS_HI);
  hard_reset_reg = new I2CRegister(lidar_addr, TFL_HARD_RESET);
  set_trig_mode_reg = new I2CRegister(lidar_addr, TFL_SET_TRIG_MODE);
  trigger_reg = new I2CRegister(lidar_addr, TFL_TRIGGER);

  tick_lo = new I2CRegister(lidar_addr, TFL_TICK_LO);
  tick_hi = new I2CRegister(lidar_addr, TFL_TICK_HI);

  constructor() {
    this.i2cbus = openSync(1).promisifiedBus();
  }

  // Get data
  async getData() {
    let tfStatus = TFL_STATUS.TFL_OK;

    // Read register from  `TFL_DIST_LO` to `TFL_TEMP_HI`
    // TODO: refactor BusIORegister to allow multi-bytes register ?
    const buffer = Buffer.alloc(6);
    await this.i2cbus.readI2cBlock(lidar_addr, TFL_DIST_LO, 6, buffer);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Step 2 - Shift data from read array into the three variables
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const dist = buffer[0] + (buffer[1] << 8);
    const flux = buffer[2] + (buffer[3] << 8);
    let temp = buffer[4] + (buffer[5] << 8);

    // Convert temperature from hundredths of a degree to a whole number
    temp = temp / 100;

    // - - Evaluate Abnormal Data Values - -
    if (dist === -1) {
      tfStatus = TFL_STATUS.TFL_WEAK;
    }
    // Signal strength <= 100
    else if (flux < 100) {
      tfStatus = TFL_STATUS.TFL_WEAK;
    }
    // Ambient light too strong
    else if (flux > 0x8000) {
      tfStatus = TFL_STATUS.TFL_FLOOD;
    }
    // Signal Strength saturation
    else if (flux == 0xffff) {
      tfStatus = TFL_STATUS.TFL_STRONG;
    }

    return {
      status: tfStatus,
      error: tfStatus !== TFL_STATUS.TFL_OK,
      dist,
      flux,
      temp,
    };
  }

  async saveSettings() {
    return await this.save_settings_reg.write(1);
  }

  //  = = = =   SOFT (SYSTEM) RESET   = = = =
  async softReset() {
    return await this.soft_reset_reg.write(2);
  }

  //  = = = = = =    SET I2C ADDRESS   = = = = = =
  // Range: 0x08, 0x77. Must reboot to take effect.
  async setI2CAddr(adrNew: number) {
    return await this.set_i2c_addr_reg.write(adrNew);
  }

  //  = = = = =   SET ENABLE   = = = = =
  async setEnable() {
    return await this.disable_reg.write(1);
  }

  //  = = = = =   SET DISABLE   = = = = =
  async setDisable() {
    return await this.disable_reg.write(0);
  }

  //  = = = = = =    SET FRAME RATE   = = = = = =
  async setFrameRate(frm: number) {
    const buffer = Buffer.alloc(2);
    // Recast the address of the unsigned integer `frm`
    // as a pointer to an unsigned byte `p_frm` ...
    buffer.writeInt16BE(frm);

    // ... then address the pointer as an array.
    this.fps_lo_reg.write(buffer[0]);
    this.fps_hi_reg.write(buffer[1]);
  }

  //  = = = = = =    GET FRAME RATE   = = = = = =
  async getFrameRate() {
    const buffer = Buffer.alloc(2);
    buffer[0] = await this.fps_lo_reg.read();
    buffer[1] = await this.fps_hi_reg.read();

    return buffer.readInt16BE();
  }

  //  = = = =   HARD RESET to Factory Defaults  = = = =
  async hardReset() {
    return await this.hard_reset_reg.write(1);
  }

  //  = = = = = =   SET CONTINUOUS MODE   = = = = = =
  // Sample LiDAR chip continuously at Frame Rate
  async setContMode() {
    return await this.set_trig_mode_reg.write(0);
  }

  //  = = = = = =   SET TRIGGER MODE   = = = = = =
  // Device will sample only once when triggered
  async setTrigMode() {
    return await this.set_trig_mode_reg.write(1);
  }

  //  = = = = = =   SET TRIGGER   = = = = = =
  // Trigger device to sample once
  async setTrigger() {
    return await this.trigger_reg.write(1);
  }

  //  = =  GET DEVICE TIME (in milliseconds) = = =
  //  Pass back time as an unsigned 16-bit variable
  async getTime() {
    const buffer = Buffer.alloc(2);
    buffer[0] = await this.tick_lo.read();
    buffer[1] = await this.tick_hi.read();

    return buffer.readInt16BE();
  }

  //  = =  GET PRODUCTION CODE (Serial Number) = = =
  // When you pass an array as a parameter to a function
  // it decays into a pointer to the first element of the array.
  // The 14 byte array variable `tfCode` declared in the example
  // sketch decays to the array pointer `p_cod`.
  async getProdCode() {
    const buffer = Buffer.alloc(14);
    await this.i2cbus.readI2cBlock(lidar_addr, TFL_SERIAL_NUM, 14, buffer);
    return buffer.join('');
  }

  //  = = = =    GET FIRMWARE VERSION   = = = =
  // The 3 byte array variable `tfVer` declared in the
  // example sketch decays to the array pointer `p_ver`.
  async getFirmwareVersion() {
    const buffer = Buffer.alloc(3);
    await this.i2cbus.readI2cBlock(lidar_addr, TFL_VER_REV, 3, buffer);
    return buffer.join('.');
  }
}
