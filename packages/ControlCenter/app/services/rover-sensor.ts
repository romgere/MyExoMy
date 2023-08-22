import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class RoverSensor extends Service {
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
