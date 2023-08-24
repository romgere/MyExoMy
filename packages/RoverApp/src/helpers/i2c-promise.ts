import type { I2CBus } from 'i2c-bus';

export async function writeByte(i2c: I2CBus, address: number, command: number, byte: number) {
  return new Promise<void>(function (resolve, reject) {
    i2c.writeByte(address, command, byte, function (e) {
      if (e) {
        reject(e);
      } else {
        resolve();
      }
    });
  });
}

export async function readByte(i2c: I2CBus, address: number, command: number) {
  return new Promise<number>(function (resolve, reject) {
    i2c.readByte(address, command, function (e: unknown, v: number) {
      if (e) {
        reject(e);
      } else {
        resolve(v);
      }
    });
  });
}

export async function readWord(i2cbus: I2CBus, address: number, cmd: number) {
  const high = await readByte(i2cbus, address, cmd);
  const low = await readByte(i2cbus, address, cmd + 1);
  let value = (high << 8) + low;

  if (value >= 0x8000) {
    value = -(65535 - value + 1);
  }

  return value;
}
