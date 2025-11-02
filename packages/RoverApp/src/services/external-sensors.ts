import Service from './-base.js';
import { external_sensor_update_interval } from '@robot/rover-app/const.js';
import GyroscopeSensor from '@robot/rover-app/lib/sensors/gyroscope.js';
import MagnetometerSensor from '@robot/rover-app/lib/sensors/magnetometer.js';
import LidarSensor from '@robot/rover-app/lib/sensors/lidar.js';
import ProximitySensor from '@robot/rover-app/lib/sensors/proximity.js';
import I2CMultiplexer from '@robot/rover-app/lib/sensors/i2c-multiplexer.js';
import Ina219, { INA219_ADDRESS_A0 } from '../lib/sensors/ina219.ts';
import type { Coord3D } from '@robot/shared/types.js';
import type { BatteryData, ProximitySensorPosition } from '@robot/shared/events.js';
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
    { position: 'FL', multiplexerAddress: 2, sensor: new ProximitySensor() },
    { position: 'FR', multiplexerAddress: 3, sensor: new ProximitySensor() },
  ];

  battery = new Ina219(INA219_ADDRESS_A0);

  multiplexer = new I2CMultiplexer();

  async init() {
    // Init sensors
    this.logger.info('init gyro...');
    await this.gyro.init();

    this.logger.info('init magneto...');
    await this.magneto.init();
    await this.magneto.setContinuousMode(true);
    await this.magneto.setDataRate(255);

    this.logger.info('init proximity sensors...');
    for (const prox of this.proximity) {
      this.logger.info(`init proximity sensor #${prox.multiplexerAddress}...`);
      await this.multiplexer.select(prox.multiplexerAddress);
      await prox.sensor.init();
      await prox.sensor.enableProximity(true);
      await prox.sensor.setProximityHighResolution(true);
    }

    this.logger.info('init lidar...');
    this.logger.log('lidar version', await this.lidar.getFirmwareVersion());

    this.logger.info('init battery sensor...');
    await this.battery.calibrate32V2A();

    this.logger.info('all sensor initialized.');

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
      this.logger.error("Can't read magnetometer data", e);
    }

    let gTemp = 0;
    let gyro: Coord3D = { x: 0, y: 0, z: 0 };
    let accel: Coord3D = { x: 0, y: 0, z: 0 };

    try {
      gTemp = await this.gyro.getTemperatureSensor();
      gyro = await this.gyro.getGyroscopeValues();
      accel = await this.gyro.getAccelerometerValues();
    } catch (e) {
      this.logger.error("Can't read gyroscope data", e);
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
      this.logger.error("Can't read lidar data", e);
    }

    const proximity: Record<ProximitySensorPosition, number> = { FR: 0, FL: 0, RR: 0, RL: 0 };

    for (const prox of this.proximity) {
      try {
        await this.multiplexer.select(prox.multiplexerAddress);

        proximity[prox.position] = await prox.sensor.getProximity();
      } catch (e) {
        this.logger.error("Can't read proximity data", e);
      }
    }

    const battery: BatteryData = {
      busVoltage: 0,
      shuntVoltage: 0,
      current: 0,
      power: 0,
    };

    try {
      battery.busVoltage = await this.battery.getBusVoltage_V();
      battery.shuntVoltage = await this.battery.getShuntVoltage_mV();
      battery.current = await this.battery.getCurrent_mA();
      battery.power = await this.battery.getPower_mW();
    } catch (e) {
      this.logger.error("Can't read battery data", e);
    }

    this.emit('externalSensor', {
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
      battery,
    });
  }
}

export default ExternalSensorsService;
