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
  size: 1 | 2;
  lsbFirst: boolean; // True = LE, False = BE

  constructor(address: number, registerAddress: number, size: 1 | 2 = 1, lsbFirst = true) {
    this.i2cbus = openSync(1).promisifiedBus();
    this.address = address;
    this.registerAddress = registerAddress;
    this.size = size;
    this.lsbFirst = lsbFirst;
  }

  async write(value: number) {
    const buffer = Buffer.alloc(this.size);
    if (this.size === 1) {
      buffer.writeUInt8(value);
    } else if (this.size === 2) {
      this.lsbFirst ? buffer.writeUInt16LE(value) : buffer.writeUInt16BE(value);
    }

    return await this.i2cbus.writeI2cBlock(this.address, this.registerAddress, this.size, buffer);
  }

  async read() {
    const res = Buffer.alloc(this.size);
    await this.i2cbus.readI2cBlock(this.address, this.registerAddress, this.size, res);
    return this.size === 1
      ? res.readUInt8()
      : this.lsbFirst
      ? res.readUInt16LE()
      : res.readUInt16BE();
  }

  // https://github.com/adafruit/Adafruit_BusIO/blob/master/Adafruit_BusIO_Register.cpp#L300-L335
  // Read a single bit from register
  async readBit(bit: number) {
    // The bitmask to read the single byte!
    const mask = 1 << bit % (8 * this.size);

    const val = await this.read();
    return Boolean(val & mask);
  }

  async readBits(startBit: number, size: number) {
    let value = 0;
    for (let i = 0; i < size; i++) {
      value <<= 8;
      const shift = this.lsbFirst ? size - i - 1 : i;
      value |= (await this.readBit(startBit + shift)) ? 1 : 0;
    }
    return value;
  }

  // Toggle a single bit in register
  // This hasn't been tested
  async writeBit(bit: number, bitValue: boolean) {
    // The bitmask to write the single byte!
    const mask = 1 << bit % (8 * this.size);

    let value = await this.read();
    if (bitValue) {
      value |= mask;
    } else {
      value &= ~mask;
    }

    return await this.write(value);
  }

  async writeBits(startBit: number, size: number, newValue: number) {
    let value = await this.read();

    for (let i = startBit; i < startBit + size; i++) {
      const shift = this.lsbFirst ? size - i - 1 : i;
      const mask = 1 << (startBit + shift) % (8 * this.size);

      if (newValue & mask) {
        value |= mask;
      } else {
        value &= ~mask;
      }
    }

    return await this.write(value);
  }
}
