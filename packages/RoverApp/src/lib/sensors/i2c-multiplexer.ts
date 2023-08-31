import { openSync } from 'i2c-bus';

import type { PromisifiedBus } from 'i2c-bus';

const multiplexer_default_addr = 0x70; // default address of multiplexer (TCA9548A)

export default class I2CMultiplexer {
  i2cbus: PromisifiedBus;
  address: number;

  constructor(address: number = multiplexer_default_addr) {
    this.address = address;
    this.i2cbus = openSync(1).promisifiedBus();
  }

  async select(childAddress: number) {
    if (childAddress < 0 && childAddress > 7) {
      throw `Invalid child address (must be between 0 & 7) : ${childAddress}`;
    }

    this.i2cbus.writeByte(this.address, 0, 1 << childAddress);
  }
}
