import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

import OrientationHelper from '@robot/control-center/utils/orientation';
import type { Orientation } from '@robot/control-center/utils/orientation';

import type { IWData } from '@robot/shared/iwconfig';
import type {
  PiSensorEvent,
  ExternalSensorEvent,
  MotorStatus,
  GPSEvent,
} from '@robot/shared/events';
import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type { ProximitySensorPosition } from '@robot/shared/events.js';
import { voltToPercent } from '../utils/battery-util';

// Defined how many gyro data entries we use to smooth values
// Given we received new data every 250ms
// 4 = we average values received from the last 1000ms but introduce a small latency on UI
const gyroHistoryLength = 4;
// Same for lidar
const lidarHistoryLength = 4;

export default class RoverSensor extends Service {
  @service declare roverConnection: RoverConnectionService;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.roverConnection.on('piSensor', this.onPiSensorEvent);
    this.roverConnection.on('externalSensor', this.onExternalSensorEvent);
    this.roverConnection.on('motorStatus', this.onMotorStatusEvent);
    this.roverConnection.on('gps', this.onGpsEvent);
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

    // Compute rover orientation according to accelerometer/magnetometer values
    const orientation = new OrientationHelper().calculate(data.gyro.accel, data.magneto.data);

    // Push data to gyro history
    this.orientationHistory.push(orientation);
    if (this.orientationHistory.length > gyroHistoryLength) {
      this.orientationHistory.splice(1, this.orientationHistory.length - gyroHistoryLength);
    }

    // Push data to lidar history
    this.lidarDistanceHistory.push(data.lidar.distance);
    if (this.lidarDistanceHistory.length > lidarHistoryLength) {
      this.lidarDistanceHistory.splice(1, this.lidarDistanceHistory.length - lidarHistoryLength);
    }

    this.proximity = data.proximity;

    this.batteryVolt = data.battery.busVoltage + data.battery.shuntVoltage / 1000;
    this.batteryPercent = voltToPercent(this.batteryVolt);
    this.current = data.battery.current;
    this.power = data.battery.power;
  }

  @action
  onMotorStatusEvent(data: MotorStatus) {
    this.motorStatus = data;
  }

  @action
  onGpsEvent(data: GPSEvent) {
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.altitude = data.altitude;
    this.speed = data.speed;
    this.heading = data.heading;
    this.status = data.status;
    this.quality = data.quality;
    this.satelitesCount = data.satelitesCount;
  }

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

  @tracked orientationHistory: Orientation[] = []; // Store a short gyro data history, used to smooth data

  // Distance returned from the lidar
  @tracked lidarDistanceHistory: number[] = []; // Store a short history, used to smooth data

  @tracked iwData?: IWData;
  @tracked iwInterface = 'wlan0';

  @tracked proximity: Record<ProximitySensorPosition, number> = { FR: 0, FL: 0, RR: 0, RL: 0 };

  @tracked motorStatus: MotorStatus = {
    motorSpeeds: [0, 0, 0, 0, 0, 0],
    motorAngles: [0, 0, 0, 0, 0, 0],
  };

  // gps
  @tracked latitude: GPSEvent['latitude'] = [51.505, 'N'];
  @tracked longitude: GPSEvent['longitude'] = [-0.09, 'E'];
  @tracked altitude: GPSEvent['altitude'] = [0, 'M'];

  @tracked speed: number = 0;
  @tracked heading: number = 0;

  @tracked status: 'A' | 'V' = 'V';
  @tracked quality: number = 0;
  @tracked satelitesCount: number = 0;

  // batterry
  @tracked batteryVolt: number = 0;
  @tracked batteryPercent: number = 0;
  @tracked current: number = 0;
  @tracked power: number = 0;

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

  get smoothedOrientation(): Orientation {
    const size = this.orientationHistory.length;
    const sum = this.orientationHistory.reduce<Orientation>(
      function (acc, { roll, pitch, yaw, heading }) {
        acc.roll += roll;
        acc.pitch += pitch;
        acc.yaw += yaw;
        acc.heading += heading;
        return acc;
      },
      { roll: 0, pitch: 0, yaw: 0, heading: 0 },
    );

    return {
      roll: Math.floor(sum.roll / size),
      pitch: Math.floor(sum.pitch / size),
      yaw: Math.floor(sum.yaw / size),
      heading: Math.floor(sum.heading / size),
    };
  }

  get smoothedLidarDistance(): number {
    const size = this.lidarDistanceHistory.length;
    const sum = this.lidarDistanceHistory.reduce<number>((acc, v) => acc + v, 0);

    return Math.floor(sum / size);
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'rover-sensor': RoverSensor;
  }
}
