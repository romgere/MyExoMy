// https://github.com/adafruit/Adafruit_VCNL4040/blob/master
import { openSync } from 'i2c-bus';
import I2CRegister from '@robot/rover-app/helpers/i2c-register.js';
import logger from '@robot/rover-app/lib/logger.js';
import sleep from '@robot/rover-app/helpers/sleep.js';

import type { PromisifiedBus } from 'i2c-bus';

const proximity_default_addr = 0x60; // default address of proximity sensor (VCNL4040)

const VCNL4040_CHIP_ID = 0x0186;

// All addresses are for 16bit registers;
// duplicates are for high or low bytes that aren't used together
const VCNL4040_ALS_CONFIG = 0x00; // Ambient light sensor configuration register
const VCNL4040_ALS_THDH = 0x01; // Ambient light high threshold register
const VCNL4040_ALS_THDL = 0x02; // Ambient light low threshold register
const VCNL4040_PS_CONF1_L = 0x03; // Proximity sensor configuration 1/2 register
const VCNL4040_PS_MS_H = 0x04; // Proximity sensor configuration 1/2 register
const VCNL4040_PS_THDL = 0x06; // Proximity sensor low threshold register
const VCNL4040_PS_THDH = 0x07; // Proximity sensor high threshold register
const VCNL4040_PS_DATA = 0x08; // Proximity sensor data register
const VCNL4040_ALS_DATA = 0x09; // Ambient light sensor data register
const VCNL4040_WHITE_DATA = 0x0a; // White light sensor data register
const VCNL4040_INT_FLAG = 0x0b; // Interrupt status register
const VCNL4040_DEVICE_ID = 0x0c; // Device ID

// Proximity LED current values
export enum led_current {
  VCNL4040_LED_CURRENT_50MA = 0,
  VCNL4040_LED_CURRENT_75MA,
  VCNL4040_LED_CURRENT_100MA,
  VCNL4040_LED_CURRENT_120MA,
  VCNL4040_LED_CURRENT_140MA,
  VCNL4040_LED_CURRENT_160MA,
  VCNL4040_LED_CURRENT_180MA,
  VCNL4040_LED_CURRENT_200MA,
}

// Proximity LED duty cycle values
export enum led_duty_cycle {
  VCNL4040_LED_DUTY_1_40 = 0,
  VCNL4040_LED_DUTY_1_80,
  VCNL4040_LED_DUTY_1_160,
  VCNL4040_LED_DUTY_1_320,
}

// Ambient light integration time values
export enum ambient_integration_time {
  VCNL4040_AMBIENT_INTEGRATION_TIME_80MS = 0,
  VCNL4040_AMBIENT_INTEGRATION_TIME_160MS,
  VCNL4040_AMBIENT_INTEGRATION_TIME_320MS,
  VCNL4040_AMBIENT_INTEGRATION_TIME_640MS,
}

// Proximity measurement integration time values
export enum proximity_integration_time {
  VCNL4040_PROXIMITY_INTEGRATION_TIME_1T = 0,
  VCNL4040_PROXIMITY_INTEGRATION_TIME_1_5T,
  VCNL4040_PROXIMITY_INTEGRATION_TIME_2T,
  VCNL4040_PROXIMITY_INTEGRATION_TIME_2_5T,
  VCNL4040_PROXIMITY_INTEGRATION_TIME_3T,
  VCNL4040_PROXIMITY_INTEGRATION_TIME_3_5T,
  VCNL4040_PROXIMITY_INTEGRATION_TIME_4T,
  VCNL4040_PROXIMITY_INTEGRATION_TIME_8T,
}

// Proximity interrupt types
export enum proximity_type {
  VCNL4040_PROXIMITY_INT_DISABLE = 0,
  VCNL4040_PROXIMITY_INT_CLOSE,
  VCNL4040_PROXIMITY_INT_AWAY,
  VCNL4040_PROXIMITY_INT_CLOSE_AWAY,
}

// Interrupt types
export enum interrupt_type {
  VCNL4040_PROXIMITY_AWAY,
  VCNL4040_PROXIMITY_CLOSE,
  VCNL4040_AMBIENT_HIGH = 4,
  VCNL4040_AMBIENT_LOW,
}

// Error Status Condition definitions
export enum TFL_STATUS {
  TFL_OK = 0, // no error
  TFL_WEAK = 10, // Signal Strength ≤ 100
  TFL_STRONG = 11, // Signal Strength saturation
  TFL_FLOOD = 12, // Ambient Light saturation
}

export default class ProximitySensor {
  i2cbus: PromisifiedBus;
  address: number;

  chip_id: I2CRegister;
  als_config: I2CRegister;
  ps_config_12: I2CRegister;
  ps_ms: I2CRegister;
  interrupt_status_register: I2CRegister;
  als_high_threshold: I2CRegister;
  als_low_threshold: I2CRegister;
  proximity_low_threshold: I2CRegister;
  proximity_high_threshold: I2CRegister;

  proximity: I2CRegister;
  ambient_light: I2CRegister;
  white_light: I2CRegister;

  constructor(address: number = proximity_default_addr) {
    this.address = address;
    this.i2cbus = openSync(1).promisifiedBus();

    // Declare various/config registers
    this.chip_id = new I2CRegister(this.address, VCNL4040_DEVICE_ID, 2);
    this.als_config = new I2CRegister(this.address, VCNL4040_ALS_CONFIG, 2);
    this.ps_config_12 = new I2CRegister(this.address, VCNL4040_PS_CONF1_L, 2);
    this.ps_ms = new I2CRegister(this.address, VCNL4040_PS_MS_H, 2);
    this.interrupt_status_register = new I2CRegister(this.address, VCNL4040_INT_FLAG + 1); // Register size is 2, but we only read byte #2
    this.als_high_threshold = new I2CRegister(this.address, VCNL4040_ALS_THDH, 2);
    this.als_low_threshold = new I2CRegister(this.address, VCNL4040_ALS_THDL, 2);
    this.proximity_low_threshold = new I2CRegister(this.address, VCNL4040_PS_THDL, 2);
    this.proximity_high_threshold = new I2CRegister(this.address, VCNL4040_PS_THDH, 2);

    // Declare "getter" registers
    this.proximity = new I2CRegister(this.address, VCNL4040_PS_DATA, 2);
    this.ambient_light = new I2CRegister(this.address, VCNL4040_ALS_DATA, 2);
    this.white_light = new I2CRegister(this.address, VCNL4040_WHITE_DATA, 2);
  }

  async init() {
    // make sure we're talking to the right chip
    if ((await this.chip_id.read()) != VCNL4040_CHIP_ID) {
      logger.error('No VCNL4040 detected');
      return false;
    }
  }

  // Gets the current proximity sensor value.
  async getProximity() {
    return await this.proximity.read();
  }

  // Gets the current ambient light sensor value.
  async getAmbientLight() {
    return await this.ambient_light.read();
  }

  // Gets the current white light value.
  async getWhiteLight() {
    // scale the light depending on the value of the integration time
    // see page 8 of the VCNL4040 application note:
    // https://www.vishay.com/docs/84307/designingvcnl4040.pdf
    return (
      (await this.white_light.read()) * (0.1 / (1 << (await this.getAmbientIntegrationTime())))
    );
  }

  // Gets the current ambient light sensor in Lux.
  async getLux() {
    // scale the lux depending on the value of the integration time
    // see page 8 of the VCNL4040 application note:
    // https://www.vishay.com/docs/84307/designingvcnl4040.pdf
    return (
      (await this.ambient_light.read()) * (0.1 / (1 << (await this.getAmbientIntegrationTime())))
    );
  }

  // Enables or disables proximity measurements
  async enableProximity(enable: boolean) {
    return await this.ps_config_12.writeBit(0, !enable);
  }

  // Enables ambient light measurements
  async enableAmbientLight(enable: boolean) {
    return await this.als_config.writeBit(0, !enable);
  }

  // Enables white light measurements
  async enableWhiteLight(enable: boolean) {
    return await this.ps_ms.writeBit(15, !enable);
  }

  /**
   * Gets and clears the interrupt status register.
   * @return The current value of the interrupt status register.
   * Indivitual interrupt types can be checked by anding the returned
   * byte with the members of `VCNL4040_InterruptType`:`VCNL4040_PROXIMITY_AWAY`,
   * `VCNL4040_PROXIMITY_CLOSE`, `PROXIMITY_LOW`, or `PROXIMITY_HIGH`
   */
  async getInterruptStatus() {
    return await this.interrupt_status_register.read();
  }

  // Enables or disables ambient light based interrupts
  async enableAmbientLightInterrupts(enable: boolean) {
    return await this.als_config.writeBit(1, enable);
  }

  // Gets the current ambient light high threshold
  async getAmbientLightHighThreshold() {
    return await this.als_high_threshold.read();
  }

  // Sets the ambient light high threshold.
  async setAmbientLightHighThreshold(high_threshold: number) {
    return await this.als_high_threshold.write(high_threshold);
  }

  // Gets the ambient light low threshold.
  async getAmbientLightLowThreshold() {
    return await this.als_low_threshold.read();
  }

  // Sets the ambient light low threshold.
  async setAmbientLightLowThreshold(low_threshold: number) {
    return await this.als_low_threshold.write(low_threshold);
  }

  /// Disables or enables proximity interrupts under a given condition.
  async enableProximityInterrupts(interrupt_condition: proximity_type) {
    this.ps_config_12.writeBit(0, Boolean(interrupt_condition & 0x1));
    this.ps_config_12.writeBit(1, Boolean(interrupt_condition & 0x2));
  }

  // Gets the proximity low threshold.
  async getProximityLowThreshold() {
    return (await this.proximity_low_threshold.read()) as proximity_type;
  }

  // Sets the proximity low threshold.
  async setProximityLowThreshold(low_threshold: number) {
    return await this.proximity_low_threshold.write(low_threshold);
  }

  // Gets the proximity high threshold.
  async getProximityHighThreshold() {
    return await this.proximity_high_threshold.read();
  }

  // Sets the proximity high threshold.
  async setProximityHighThreshold(high_threshold: number) {
    return await this.proximity_high_threshold.write(high_threshold);
  }

  // Gets the integration time for proximity sensing measurements.
  async getProximityIntegrationTime() {
    return (await this.ps_config_12.readBits(1, 3)) as proximity_integration_time;
  }

  // Sets the integration time for proximity sensing measurements.
  async setProximityIntegrationTime(integration_time: proximity_integration_time) {
    return await this.ps_config_12.writeBits(1, 3, integration_time);
  }

  // Gets the integration time for ambient light sensing measurements.
  async getAmbientIntegrationTime() {
    return (await this.als_config.readBits(6, 2)) as ambient_integration_time;
  }

  // Sets the integration time for ambient light sensing measurements.
  async setAmbientIntegrationTime(integration_time: ambient_integration_time) {
    // delay according to the integration time to let the reading at the old IT
    // clear out
    const old_it_ms = (8 << (await this.getAmbientIntegrationTime())) * 10;
    const new_it_ms = (8 << integration_time) * 10;

    const ret = await this.als_config.writeBits(6, 2, integration_time);

    await sleep(old_it_ms + new_it_ms + 1);

    return ret;
  }

  // Gets the current for the LED used for proximity measurements.
  async getProximityLEDCurrent() {
    return (await this.ps_ms.readBits(8, 2)) as led_current;
  }

  // Sets the current for the LED used for proximity measurements.
  async setProximityLEDCurrent(led_current: led_current) {
    return await this.ps_ms.writeBits(8, 2, led_current);
  }

  // Sets the duty cycle for the LED used for proximity measurements.
  async getProximityLEDDutyCycle() {
    return (await this.ps_config_12.readBits(6, 2)) as led_duty_cycle;
  }

  // Sets the duty cycle for the LED used for proximity measurements.
  async setProximityLEDDutyCycle(duty_cycle: led_duty_cycle) {
    return await this.ps_config_12.writeBits(6, 2, duty_cycle);
  }

  // Gets the resolution of proximity measurements
  async getProximityHighResolution() {
    return await this.ps_config_12.readBit(11);
  }

  // Sets the resolution of proximity measurements
  async setProximityHighResolution(high_resolution: boolean) {
    return await this.ps_config_12.writeBit(11, high_resolution);
  }
}
