import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

import OrientationHelper from '@robot/control-center/utils/orientation';
import type { Orientation } from '@robot/control-center/utils/orientation';

import type { IWData } from '@robot/shared/iwconfig';
import type { PiSensorEvent, ExternalSensorEvent } from '@robot/shared/events';
import type RoverConnectionService from '@robot/control-center/services/rover-connection';

// Defined how many gyro data entries we use to smooth values
// Given we received new data every 50ms
// 10 = we average values received from the last 500ms but introduce a 500 ms latency on UI
const gyroHistoryLength = 10;

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

    // Compute rover orientation according to accelerometer/magnetometer values
    const orientation = new OrientationHelper().calculate(data.gyro.accel, data.magneto.data);

    // Push data to gyro history
    this.orientationHistory.push(orientation);
    if (this.orientationHistory.length > gyroHistoryLength) {
      this.orientationHistory.splice(1, this.orientationHistory.length - gyroHistoryLength);
    }
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

  // Add :
  // proximity sensor
  // distance sensor
  // gps
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'rover-sensor': RoverSensor;
  }
}
