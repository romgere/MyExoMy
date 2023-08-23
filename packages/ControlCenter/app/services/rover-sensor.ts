import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

import type { PiSensorEvent } from '@robot/shared/events';
import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import { IWData } from '@robot/shared/iwconfig';

export default class RoverSensor extends Service {
  @service declare roverConnection: RoverConnectionService;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.roverConnection.on('piSensor', this.onPiSensorEvent);
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
    this.temperature = data.temperature;

    this.iwData = data.iwData;
  }

  // Result of `vcgencmd get_throttled`
  @tracked underVoltage = false;
  @tracked armFreqCapped = false;
  @tracked throttled = true;
  @tracked softTemperatureLimit = false;
  @tracked underVoltageOccurred = true;
  @tracked armFreqCappedOccurred = false;
  @tracked throttledOccurred = false;
  @tracked softTemperatureLimitOccurred = false;

  // Result of `vcgencmd measure_temp`
  @tracked temperature = 0;

  @tracked iwData?: IWData;
  @tracked iwInterface = 'wlan0';

  get temperatureString() {
    return `${this.temperature} °c`;
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
