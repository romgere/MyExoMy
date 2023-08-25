import Service from './-base.js';
import { external_sensor_update_interval } from '@robot/rover-app/const.js';
import GyroscopeSensor from '@robot/rover-app/lib/sensors/gyroscope.js';
import MagnetometerSensor from '@robot/rover-app/lib/sensors/magnetometer.js';

class ExternalSensorsService extends Service {
  static serviceName = 'external-sensors';

  internal?: NodeJS.Timeout;

  gyro: GyroscopeSensor;
  magneto: MagnetometerSensor;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.gyro = new GyroscopeSensor();
    this.magneto = new MagnetometerSensor();
  }

  async init() {
    // Init sensors
    await this.gyro.init();
    await this.magneto.init();

    this.internal = setInterval(
      this.sendExtenalSensorEvent.bind(this),
      external_sensor_update_interval,
    );
  }

  // Aggregate all external sensor values & send a single "externalSensor" event
  async sendExtenalSensorEvent() {
    const magneto = await this.magneto.getEvent();
    const mTemp = await this.magneto.readTemperature();

    const gTemp = await this.gyro.getTemperatureSensor();
    const gyro = await this.gyro.getGyroscopeValues();
    const accel = await this.gyro.getAccelerometerValues();

    this.eventBroker.emit('externalSensor', {
      gyro: {
        gyro,
        accel,
        temperature: gTemp,
      },
      magneto: {
        data: magneto,
        temperature: mTemp,
      },
    });
  }
}

export default ExternalSensorsService;
