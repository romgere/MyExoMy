import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

import type { PiSensorEvent } from '@robot/shared/events';
import type RoverConnectionService from '@robot/control-center/services/rover-connection';

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

  get temperatureString() {
    return `${this.temperature} °c`;
  }

  // Add :
  // proximity sensor
  // distance sensor
  // gyro sensor
  // magnetic sensor
  // gps
  // wifi / mobile connection speed
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'rover-sensor': RoverSensor;
  }
}
