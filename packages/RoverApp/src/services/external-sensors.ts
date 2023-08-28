import Service from './-base.js';
import { external_sensor_update_interval } from '@robot/rover-app/const.js';
import GyroscopeSensor from '@robot/rover-app/lib/sensors/gyroscope.js';
import MagnetometerSensor from '@robot/rover-app/lib/sensors/magnetometer.js';
import LidarSensor from '@robot/rover-app/lib/sensors/lidar.js';
import ProximitySensor from '@robot/rover-app/lib/sensors/proximity.js';

class ExternalSensorsService extends Service {
  static serviceName = 'external-sensors';

  internal?: NodeJS.Timeout;

  gyro = new GyroscopeSensor();
  magneto = new MagnetometerSensor();
  lidar = new LidarSensor();
  proximity = new ProximitySensor();

  async init() {
    // Init sensors
    await this.gyro.init();
    await this.magneto.init();
    await this.magneto.setContinuousMode(true);
    await this.magneto.setDataRate(255);
    await this.proximity.init();

    this.internal = setInterval(
      this.sendExtenalSensorEvent.bind(this),
      external_sensor_update_interval,
    );
  }

  // Aggregate all external sensor values & send a single "externalSensor" event
  async sendExtenalSensorEvent() {
    const magneto = await this.magneto.getEvent();
    // can't read temperature when continuous mode is on
    const mTemp = 0; // await this.magneto.readTemperature();

    const gTemp = await this.gyro.getTemperatureSensor();
    const gyro = await this.gyro.getGyroscopeValues();
    const accel = await this.gyro.getAccelerometerValues();

    const lidar = await this.lidar.getData();

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
      lidar: {
        temperature: lidar.temp,
        distance: lidar.dist,
        flux: lidar.flux,
        error: lidar.status,
      },
    });

    console.log('getProximity', await this.proximity.getProximity());
    console.log('getAmbientLight', await this.proximity.getAmbientLight());
    console.log('getWhiteLight', await this.proximity.getWhiteLight());
    console.log('getLux', await this.proximity.getLux());
  }
}

export default ExternalSensorsService;
