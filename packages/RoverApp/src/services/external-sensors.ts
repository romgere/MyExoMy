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
    const m = await this.magneto.getEvent();

    // Calculate the angle of the vector y,x
    let heading = (Math.atan2(m.y, m.x) * 180) / Math.PI;
    // Normalize to 0-360
    if (heading < 0) {
      heading = 360 + heading;
    }

    console.log('magneto', {
      x: m.x.toFixed(2),
      y: m.y.toFixed(2),
      z: m.z.toFixed(2),
      heading: heading.toFixed(1),
    });

    const t = await this.magneto.readTemperature();
    console.log('temperature', t.toFixed(2));

    // const temperature = await this.gyro.getTemperatureSensor();
    // const gyro = await this.gyro.getGyroSensor();

    // this.eventBroker.emit('externalSensor', {
    //   gyro,
    //   temperature,
    // });
  }
}

export default ExternalSensorsService;
