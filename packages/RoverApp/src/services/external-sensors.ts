import Service from './-base.js';
import { external_sensor_update_interval } from '@robot/rover-app/const.js';
import GyroscopeSensor from '@robot/rover-app/lib/sensors/gyroscope.js';
import MagnetometerSensor from '@robot/rover-app/lib/sensors/magnetometer.js';
import LidarSensor from '@robot/rover-app/lib/sensors/lidar.js';
import ProximitySensor from '@robot/rover-app/lib/sensors/proximity.js';
import I2CMultiplexer from '@robot/rover-app/lib/sensors/i2c-multiplexer.js';
import logger from '@robot/rover-app/lib/logger.js';

import type { Coord3D } from '@robot/shared/types.js';
import type { ProximitySensorPosition } from '@robot/shared/events.js';
import type { LidarData } from '@robot/rover-app/lib/sensors/lidar.js';

type ProximitySensors = {
  position: ProximitySensorPosition;
  sensor: ProximitySensor;
  multiplexerAddress: number;
};

class ExternalSensorsService extends Service {
  static serviceName = 'external-sensors';

  internal?: NodeJS.Timeout;

  gyro = new GyroscopeSensor();
  magneto = new MagnetometerSensor();
  lidar = new LidarSensor();
  proximity: ProximitySensors[] = [
    { position: 'RR', multiplexerAddress: 0, sensor: new ProximitySensor() },
    { position: 'RL', multiplexerAddress: 1, sensor: new ProximitySensor() },
    { position: 'FR', multiplexerAddress: 2, sensor: new ProximitySensor() },
    { position: 'FL', multiplexerAddress: 3, sensor: new ProximitySensor() },
  ];

  multiplexer = new I2CMultiplexer();

  async init() {
    // Init sensors
    logger.info('init gyro...');
    await this.gyro.init();

    logger.info('init magneto...');
    await this.magneto.init();
    await this.magneto.setContinuousMode(true);
    await this.magneto.setDataRate(255);

    logger.info('init proximity sensors...');
    for (const prox of this.proximity) {
      logger.info(`init proximity sensor #${prox.multiplexerAddress}...`);
      await this.multiplexer.select(prox.multiplexerAddress);
      await prox.sensor.init();
      await prox.sensor.enableProximity(true);
      await prox.sensor.setProximityHighResolution(true);
    }

    logger.info('init lidar...');
    logger.log('lidar version', await this.lidar.getFirmwareVersion());

    logger.info('all sensor initialized.');

    this.internal = setInterval(
      this.sendExtenalSensorEvent.bind(this),
      external_sensor_update_interval,
    );
  }

  // Aggregate all external sensor values & send a single "externalSensor" event
  async sendExtenalSensorEvent() {
    let magneto: Coord3D = { x: 0, y: 0, z: 0 };
    let mTemp = 0;

    try {
      magneto = await this.magneto.getEvent();
      // can't read temperature when continuous mode is on
      mTemp = 0; // await this.magneto.readTemperature();
    } catch (e) {
      logger.error("Can't read magnetometer data", e);
    }

    let gTemp = 0;
    let gyro: Coord3D = { x: 0, y: 0, z: 0 };
    let accel: Coord3D = { x: 0, y: 0, z: 0 };

    try {
      gTemp = await this.gyro.getTemperatureSensor();
      gyro = await this.gyro.getGyroscopeValues();
      accel = await this.gyro.getAccelerometerValues();
    } catch (e) {
      logger.error("Can't read gyroscope data", e);
    }

    let lidar: LidarData = {
      status: 0,
      error: true,
      dist: 0,
      flux: 0,
      temp: 0,
    };

    try {
      lidar = await this.lidar.getData();
    } catch (e) {
      logger.error("Can't read lidar data", e);
    }

    const proximity: Record<ProximitySensorPosition, number> = { FR: 0, FL: 0, RR: 0, RL: 0 };
    for (const prox of this.proximity) {
      try {
        await this.multiplexer.select(prox.multiplexerAddress);
        proximity[prox.position] = await prox.sensor.getProximity();
      } catch (e) {
        logger.error("Can't read proximity data", e);
      }
    }

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
      proximity,
    });
  }
}

export default ExternalSensorsService;
