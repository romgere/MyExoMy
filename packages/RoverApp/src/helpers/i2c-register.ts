import { openSync } from 'i2c-bus';
import type { PromisifiedBus } from 'i2c-bus';

/**
 * https://github.com/adafruit/Adafruit_BusIO/blob/master/Adafruit_BusIO_Register.cpp
 * This allow to read/write from/into an I2C Register.
 * Currently, this only support 1 Byte register.
 * read/write value are Unsigned Int (1 Byte)
 *
 * readBit/writeBit allow reading/writing a single bit into the register without touching other bits.
 */
export default class I2CRegister {
  i2cbus: PromisifiedBus;
  address: number;
  registerAddress: number;

  constructor(address: number, registerAddress: number) {
    this.i2cbus = openSync(1).promisifiedBus();
    this.address = address;
    this.registerAddress = registerAddress;
  }

  async write(value: number) {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(value);

    return await this.i2cbus.writeI2cBlock(this.address, this.registerAddress, 1, buffer);
  }

  async read() {
    const res = Buffer.alloc(1);
    await this.i2cbus.readI2cBlock(this.address, this.registerAddress, 1, res);
    return res.readUInt8();
  }

  // https://github.com/adafruit/Adafruit_BusIO/blob/master/Adafruit_BusIO_Register.cpp#L300-L335
  // Read a single bit from register
  async readBit(bit: number) {
    // The bitmask to read the single byte!
    const mask = 1 << bit % 8;

    const val = await this.read();
    return Boolean(val & mask);
  }

  // Toggle a single bit in register
  // This hasn't been tested
  async writeBit(bit: number, bitValue: boolean) {
    // The bitmask to write the single byte!
    const mask = 1 << bit % 8;

    let value = await this.read();
    if (bitValue) {
      value |= mask;
    } else {
      value &= ~mask;
    }

    return await this.write(value);
  }
}
