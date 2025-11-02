// https://github.com/adafruit/Adafruit_INA219/blob/master/Adafruit_INA219.cpp
import I2CRegister, { BitOrder } from '@robot/rover-app/helpers/i2c-register.ts';

export default class Ina219 {
  private calibrationReg: I2CRegister;
  private configReg: I2CRegister;
  private busVoltageReg: I2CRegister;
  private shuntVoltageReg: I2CRegister;
  private currentReg: I2CRegister;
  private powerReg: I2CRegister;

  private address: number;

  private currentDivider_mA = 0;
  private powerDivider_mW = 0;
  private calValue = 0;

  constructor(address = INA219_ADDRESS) {
    this.address = address;

    this.calibrationReg = new I2CRegister(
      this.address,
      INA219_REG_CALIBRATION,
      2,
      BitOrder.MSB_First,
    );
    this.configReg = new I2CRegister(this.address, INA219_REG_CONFIG, 2, BitOrder.MSB_First);

    this.busVoltageReg = new I2CRegister(
      this.address,
      INA219_REG_BUSVOLTAGE,
      2,
      BitOrder.MSB_First,
    );
    this.shuntVoltageReg = new I2CRegister(
      this.address,
      INA219_REG_SHUNTVOLTAGE,
      2,
      BitOrder.MSB_First,
    );
    this.currentReg = new I2CRegister(this.address, INA219_REG_CURRENT, 2, BitOrder.MSB_First);
    this.powerReg = new I2CRegister(this.address, INA219_REG_POWER, 2, BitOrder.MSB_First);
  }

  async calibrate32V1A() {
    this.calValue = 10240;
    this.currentDivider_mA = 25;
    this.powerDivider_mW = 0.8;

    await this.calibrationReg.write(this.calValue);

    const config =
      INA219_CONFIG_BVOLTAGERANGE_32V |
      INA219_CONFIG_GAIN_8_320MV |
      INA219_CONFIG_BADCRES_12BIT |
      INA219_CONFIG_SADCRES_12BIT_1S_532US |
      INA219_CONFIG_MODE_SANDBVOLT_CONTINUOUS;

    await this.configReg.write(config);
  }

  async calibrate32V2A() {
    this.calValue = 4096;
    this.currentDivider_mA = 10;
    this.powerDivider_mW = 2;

    await this.calibrationReg.write(this.calValue);

    const config =
      INA219_CONFIG_BVOLTAGERANGE_32V |
      INA219_CONFIG_GAIN_8_320MV |
      INA219_CONFIG_BADCRES_12BIT |
      INA219_CONFIG_SADCRES_12BIT_1S_532US |
      INA219_CONFIG_MODE_SANDBVOLT_CONTINUOUS;

    await this.configReg.write(config);
  }

  async calibration16V400mA() {
    this.calValue = 8192;
    this.currentDivider_mA = 20;
    this.powerDivider_mW = 1;

    await this.calibrationReg.write(this.calValue);

    const config =
      INA219_CONFIG_BVOLTAGERANGE_16V |
      INA219_CONFIG_GAIN_1_40MV |
      INA219_CONFIG_BADCRES_12BIT |
      INA219_CONFIG_SADCRES_12BIT_1S_532US |
      INA219_CONFIG_MODE_SANDBVOLT_CONTINUOUS;

    await this.configReg.write(config);
  }

  /**
   *  Gets the bus voltage in volts
   */
  async getBusVoltage_V() {
    const value = await this.busVoltageReg.read();
    return (value >> 3) * 4 * 0.001;
  }

  /**
   * Gets the shunt voltage in mV (so +-327mV)
   */
  async getShuntVoltage_mV() {
    const value = await this.shuntVoltageReg.read();
    return value * 0.01;
  }

  /**
   * Gets the current value in mA, taking into account the config settings and current LSB
   */
  async getCurrent_mA() {
    // Sometimes a sharp load will reset the INA219, which will reset the cal register, meaning CURRENT and POWER will not be available ...
    // avoid this by always setting a cal value even if it's an unfortunate extra step
    await this.calibrationReg.write(this.calValue);
    const value = await this.currentReg.read();
    return value / this.currentDivider_mA;
  }

  async getPower_mW() {
    // Sometimes a sharp load will reset the INA219, which will reset the cal register, meaning CURRENT and POWER will not be available ...
    // avoid this by always setting a cal value even if it's an unfortunate extra step
    await this.calibrationReg.write(this.calValue);
    const value = await this.powerReg.read();
    return value * this.powerDivider_mW;
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// ===========================================================================
//   I2C ADDRESS/BITS
// ==========================================================================
export const INA219_ADDRESS = 0x40; // 1000000 (A0+A1=GND)
export const INA219_ADDRESS_A0 = 0x41;
export const INA219_ADDRESS_A1 = 0x44;
export const INA219_ADDRESS_A0_A1 = 0x45;

const INA219_READ = 0x01;

// ===========================================================================
//    CONFIG REGISTER (R/W)
// ===========================================================================
const INA219_REG_CONFIG = 0x00;

// ===========================================================================
const INA219_CONFIG_RESET = 0x8000; // Reset Bit
const INA219_CONFIG_BVOLTAGERANGE_MASK = 0x2000; // Bus Voltage Range Mask
const INA219_CONFIG_BVOLTAGERANGE_16V = 0x0000; // 0-16V Range
const INA219_CONFIG_BVOLTAGERANGE_32V = 0x2000; // 0-32V Range

const INA219_CONFIG_GAIN_MASK = 0x1800; // Gain Mask
const INA219_CONFIG_GAIN_1_40MV = 0x0000; // Gain 1, 40mV Range
const INA219_CONFIG_GAIN_2_80MV = 0x0800; // Gain 2, 80mV Range
const INA219_CONFIG_GAIN_4_160MV = 0x1000; // Gain 4, 160mV Range
const INA219_CONFIG_GAIN_8_320MV = 0x1800; // Gain 8, 320mV Range

const INA219_CONFIG_BADCRES_MASK = 0x0780; // Bus ADC Resolution Mask
const INA219_CONFIG_BADCRES_9BIT = 0x0080; // 9-bit bus res = 0..511
const INA219_CONFIG_BADCRES_10BIT = 0x0100; // 10-bit bus res = 0..1023
const INA219_CONFIG_BADCRES_11BIT = 0x0200; // 11-bit bus res = 0..2047
const INA219_CONFIG_BADCRES_12BIT = 0x0400; // 12-bit bus res = 0..4097

const INA219_CONFIG_SADCRES_MASK = 0x0078; // Shunt ADC Resolution and Averaging Mask
const INA219_CONFIG_SADCRES_9BIT_1S_84US = 0x0000; // 1 x 9-bit shunt sample
const INA219_CONFIG_SADCRES_10BIT_1S_148US = 0x0008; // 1 x 10-bit shunt sample
const INA219_CONFIG_SADCRES_11BIT_1S_276US = 0x0010; // 1 x 11-bit shunt sample
const INA219_CONFIG_SADCRES_12BIT_1S_532US = 0x0018; // 1 x 12-bit shunt sample
const INA219_CONFIG_SADCRES_12BIT_2S_1060US = 0x0048; // 2 x 12-bit shunt samples averaged together
const INA219_CONFIG_SADCRES_12BIT_4S_2130US = 0x0050; // 4 x 12-bit shunt samples averaged together
const INA219_CONFIG_SADCRES_12BIT_8S_4260US = 0x0058; // 8 x 12-bit shunt samples averaged together
const INA219_CONFIG_SADCRES_12BIT_16S_8510US = 0x0060; // 16 x 12-bit shunt samples averaged together
const INA219_CONFIG_SADCRES_12BIT_32S_17MS = 0x0068; // 32 x 12-bit shunt samples averaged together
const INA219_CONFIG_SADCRES_12BIT_64S_34MS = 0x0070; // 64 x 12-bit shunt samples averaged together
const INA219_CONFIG_SADCRES_12BIT_128S_69MS = 0x0078; // 128 x 12-bit shunt samples averaged together

const INA219_CONFIG_MODE_MASK = 0x0007; // Operating Mode Mask
const INA219_CONFIG_MODE_POWERDOWN = 0x0000;
const INA219_CONFIG_MODE_SVOLT_TRIGGERED = 0x0001;
const INA219_CONFIG_MODE_BVOLT_TRIGGERED = 0x0002;
const INA219_CONFIG_MODE_SANDBVOLT_TRIGGERED = 0x0003;
const INA219_CONFIG_MODE_ADCOFF = 0x0004;
const INA219_CONFIG_MODE_SVOLT_CONTINUOUS = 0x0005;
const INA219_CONFIG_MODE_BVOLT_CONTINUOUS = 0x0006;
const INA219_CONFIG_MODE_SANDBVOLT_CONTINUOUS = 0x0007;

// ===========================================================================
//   SHUNT VOLTAGE REGISTER (R)
// ===========================================================================
const INA219_REG_SHUNTVOLTAGE = 0x01;
// ===========================================================================

// ===========================================================================
//   BUS VOLTAGE REGISTER (R)
// ===========================================================================
const INA219_REG_BUSVOLTAGE = 0x02;
// ===========================================================================

// ===========================================================================
//   POWER REGISTER (R)
// ===========================================================================
const INA219_REG_POWER = 0x03;
// ===========================================================================

// ==========================================================================
//    CURRENT REGISTER (R)
// ===========================================================================
const INA219_REG_CURRENT = 0x04;
// ===========================================================================

// ===========================================================================
//    CALIBRATION REGISTER (R/W)
// ===========================================================================
const INA219_REG_CALIBRATION = 0x05;
// ===========================================================================
