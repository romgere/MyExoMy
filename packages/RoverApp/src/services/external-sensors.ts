import Service from './-base.js';
import { openSync } from 'i2c-bus';
import { external_sensor_update_interval } from '@robot/rover-app/const.js';
import GyroscopeSensor from '@robot/rover-app/lib/sensors/gyroscope.js';

import type { I2CBus } from 'i2c-bus';

class ExternalSensorsService extends Service {
  static serviceName = 'external-sensors';

  i2cbus: I2CBus;
  internal?: NodeJS.Timeout;

  gyro: GyroscopeSensor;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.i2cbus = openSync(1);
    this.gyro = new GyroscopeSensor(this.i2cbus);
  }

  async init() {
    // Init sensors
    await this.gyro.init();

    this.internal = setInterval(
      this.sendExtenalSensorEvent.bind(this),
      external_sensor_update_interval,
    );
  }

  // Aggregate all external sensor values & send a single "externalSensor" event
  async sendExtenalSensorEvent() {
    const temperature = await this.this.gyro.getTemperatureSensor();
    const gyro = await this.this.gyro.getGyroSensor();

    this.eventBroker.emit('externalSensor', {
      gyro,
      temperature,
    });
  }
}

export default ExternalSensorsService;
