// inspired from https://github.com/normen/rpi-throttled/blob/master/lib.js
import Service from './-base.js';
import { spawn } from 'child_process';
import { pi_sensor_update_interval } from '@robot/rover-app/const.js';
import parseIwconfig from '@robot/rover-app/helpers/iwconfig-parser.js';
import logger from '@robot/rover-app/lib/logger.js';

import type { PiSensorEvent } from '@robot/shared/events.js';

// vcgencmd Flag bits
const UNDERVOLTED = 0;
const CAPPED = 1;
const THROTTLED = 2;
const SOFT_TEMPLIMIT = 3;
const HAS_UNDERVOLTED = 16;
const HAS_CAPPED = 17;
const HAS_THROTTLED = 18;
const HAS_SOFT_TEMPLIMIT = 19;

type VcgencmdCommand = 'get_throttled' | 'measure_temp';

class PiSensorsService extends Service {
  static serviceName = 'pi-sensors';
  internal?: NodeJS.Timeout;

  async init() {
    this.internal = setInterval(this.updateSensors.bind(this), pi_sensor_update_interval);
  }

  async getVcgencmd(cmd: VcgencmdCommand): Promise<string> {
    return new Promise(function (resolve) {
      spawn('vcgencmd', [cmd]).stdout.on('data', (data) => {
        resolve(String(data));
      });
    });
  }

  async runIWConfig(): Promise<string> {
    return new Promise(function (resolve) {
      spawn('iwconfig').stdout.on('data', (data) => {
        resolve(String(data));
      });
    });
  }

  async getIWConfig() {
    try {
      const file = await this.runIWConfig();
      return parseIwconfig(file);
    } catch (e) {
      logger.error('unable to get iwconfig data', e);
      return {};
    }
  }

  async updateSensors() {
    const throttledString = await this.getVcgencmd('get_throttled');
    const throttledValue = parseInt(throttledString.replace('throttled=', ''), 16);

    const tempString = await this.getVcgencmd('measure_temp');
    const tempValue = parseFloat(tempString.replace('temp=', '').replace("'C", ''));

    const iwData = await this.getIWConfig();

    const event: PiSensorEvent = {
      underVoltage: Boolean((throttledValue >> UNDERVOLTED) & 1),
      armFreqCapped: Boolean((throttledValue >> CAPPED) & 1),
      throttled: Boolean((throttledValue >> THROTTLED) & 1),
      softTemperatureLimit: Boolean((throttledValue >> SOFT_TEMPLIMIT) & 1),
      underVoltageOccurred: Boolean((throttledValue >> HAS_UNDERVOLTED) & 1),
      armFreqCappedOccurred: Boolean((throttledValue >> HAS_CAPPED) & 1),
      throttledOccurred: Boolean((throttledValue >> HAS_THROTTLED) & 1),
      softTemperatureLimitOccurred: Boolean((throttledValue >> HAS_SOFT_TEMPLIMIT) & 1),
      temperature: tempValue,
      iwData,
    };

    this.emit('piSensor', event);
  }
}

export default PiSensorsService;
