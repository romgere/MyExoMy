import { openSync } from 'i2c-bus';
import type { PromisifiedBus } from 'i2c-bus';

export enum BitOrder {
  LSB_First = 0, //LE
  MSB_First = 1, // BE
}

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
  size: number;
  bitOrder: BitOrder; // True = LE, False = BE

  constructor(
    address: number,
    registerAddress: number,
    size: number = 1,
    bitOrder: BitOrder = BitOrder.LSB_First,
  ) {
    this.i2cbus = openSync(1).promisifiedBus();
    this.address = address;
    this.registerAddress = registerAddress;
    this.size = size;
    this.bitOrder = bitOrder;
  }

  async write(value: number) {
    const buffer = Buffer.alloc(this.size);

    for (let i = 0; i < this.size; i++) {
      const idx = this.bitOrder === BitOrder.LSB_First ? i : this.size - i - 1;
      buffer[idx] = value & 0xff;
      value >>= 8;
    }

    return await this.i2cbus.writeI2cBlock(this.address, this.registerAddress, this.size, buffer);
  }

  async read() {
    const buffer = Buffer.alloc(this.size);
    await this.i2cbus.readI2cBlock(this.address, this.registerAddress, this.size, buffer);

    let value = 0;
    for (let i = 0; i < this.size; i++) {
      value <<= 8;
      const idx = this.bitOrder === BitOrder.LSB_First ? this.size - i - 1 : i;
      value |= buffer[idx] & 0xff;
    }

    return value;
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
      value <<= 1;
      const shift = this.bitOrder === BitOrder.LSB_First ? size - i - 1 : i;
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
      const shift = this.bitOrder === BitOrder.LSB_First ? i : size - i - 1;
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
