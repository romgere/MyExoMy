import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { getGyroX, getGyroY, getGyroZ } from '@robot/control-center/utils/gyro';

import type { IWData } from '@robot/shared/iwconfig';
import type { Coord3D } from '@robot/shared/types';
import type { PiSensorEvent, ExternalSensorEvent } from '@robot/shared/events';
import type RoverConnectionService from '@robot/control-center/services/rover-connection';

// Defined how many gyro data entries we use to smooth values
// Given we received new data every 50ms
// 10 = we average values received from the last 500ms but introduce a 500 ms latency on UI
const gyroHistoryLength = 10;
const gyroAccelerationScaleFactor = 16384.0; // scale factors of accelerometer

export default class RoverSensor extends Service {
  @service declare roverConnection: RoverConnectionService;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.roverConnection.on('piSensor', this.onPiSensorEvent);
    this.roverConnection.on('externalSensor', this.onExternalSensorEvent);
  }

  @action
  onPiSensorEvent(data: PiSensorEvent) {
    this.underVoltage = data.underVoltage;
    this.armFreqCapped = data.armFreqCapped;
    this.throttled = data.throttled;
    this.softTemperatureLimit = data.softTemperatureLimit;
    this.underVoltageOccurred = data.underVoltageOccurred;
    this.armFreqCappedOccurred = data.armFreqCappedOccurred;
    this.throttledOccurred = data.throttledOccurred;
    this.softTemperatureLimitOccurred = data.softTemperatureLimitOccurred;
    this.piTemperature = data.temperature;

    this.iwData = data.iwData;
  }

  @action
  onExternalSensorEvent(data: ExternalSensorEvent) {
    this.bodyTemperature = data.gyro.temperature;

    // Compute rover orientation according to accelerometer values (from gyroscope sensor)
    const orientation = this.computeRoverOrientation(data);

    // Push data to gyro history
    this.gyroHistory.push(orientation);
    if (this.gyroHistory.length > gyroHistoryLength) {
      this.gyroHistory.splice(1, this.gyroHistory.length - gyroHistoryLength);
    }

    this.magneto = data.magneto.data;
  }

  computeRoverOrientation(data: ExternalSensorEvent) {
    const { x: accelX, y: accelY, z: accelZ } = data.gyro.accel;

    // scaled accelerometer values
    const accelXScaled = accelX / gyroAccelerationScaleFactor;
    const accelYScaled = accelY / gyroAccelerationScaleFactor;
    const accelZScaled = accelZ / gyroAccelerationScaleFactor;

    return {
      x: getGyroY(accelXScaled, accelYScaled, accelZScaled),
      y: getGyroX(accelXScaled, accelYScaled, accelZScaled),
      z: getGyroZ(accelXScaled, accelYScaled, accelZScaled),
    };
  }

  // test() {
  //   // Signs choosen so that, when axis is down, the value is + 1g
  //   float accl_x = -event_accl.acceleration.x;
  //   float accl_y = event_accl.acceleration.y;
  //   float accl_z = event_accl.acceleration.z;

  // // Signs should be choosen so that, when the axis is down, the value is + positive.
  // // But that doesn't seem to work ?...
  // float magn_x = event_magn.magnetic.x - hardiron_x;
  // float magn_y = -event_magn.magnetic.y - hardiron_y;
  // float magn_z = -event_magn.magnetic.z - hardiron_z;

  // // Freescale solution
  // roll = atan2(accl_y, accl_z);
  // pitch = atan(-accl_x / (accl_y * sin(roll) + accl_z * cos(roll)));

  // float magn_fy_fs = magn_z * sin(roll) - magn_y*cos(roll);
  // float magn_fx_fs = magn_x * cos(pitch) + magn_y * sin(pitch) * sin(roll) + magn_z * sin(pitch) * cos(roll);

  // yaw = atan2(magn_fy_fs, magn_fx_fs);

  // roll = roll * RAD_CONV;
  // pitch = pitch * RAD_CONV;
  // yaw = yaw * RAD_CONV;

  // heading = yawToHeading(yaw)
  // }

  // Result of `vcgencmd get_throttled`
  @tracked underVoltage = false;
  @tracked armFreqCapped = false;
  @tracked throttled = false;
  @tracked softTemperatureLimit = false;
  @tracked underVoltageOccurred = false;
  @tracked armFreqCappedOccurred = false;
  @tracked throttledOccurred = false;
  @tracked softTemperatureLimitOccurred = false;

  // Result of `vcgencmd measure_temp`
  @tracked piTemperature = 0;

  // Temperature from gyroscope sensor (in rover body, based on gyro sensor)
  @tracked bodyTemperature = 0;

  @tracked gyro: Coord3D = { x: 0, y: 0, z: 0 };
  @tracked gyroHistory: Coord3D[] = []; // Store a short gyro data history, used to smooth data

  @tracked magneto: Coord3D = { x: 0, y: 0, z: 0 };

  @tracked iwData?: IWData;
  @tracked iwInterface = 'wlan0';

  get piTemperatureString() {
    return `${this.piTemperature} °c`;
  }

  get bodyTemperatureString() {
    return `${this.bodyTemperature} °c`;
  }

  get currentIwData() {
    return this.iwData?.[this.iwInterface];
  }

  get networkLinkQuality(): number {
    const [value, max] = this.currentIwData?.LinkQuality.split('/').map((s) => parseInt(s)) ?? [
      100, 100,
    ];

    return Math.ceil((value / max) * 100);
  }

  get smoothedGyro(): Coord3D {
    const size = this.gyroHistory.length;
    const sum = this.gyroHistory.reduce<Coord3D>(
      function (acc, { x, y, z }) {
        acc.x += x;
        acc.z += z;
        acc.y += y;
        return acc;
      },
      { x: 0, y: 0, z: 0 },
    );

    return {
      x: Math.floor(sum.x / size),
      y: Math.floor(sum.y / size),
      z: Math.floor(sum.z / size),
    };
  }

  // Add :
  // proximity sensor
  // distance sensor
  // gyro sensor
  // magnetic sensor
  // gps
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'rover-sensor': RoverSensor;
  }
}
