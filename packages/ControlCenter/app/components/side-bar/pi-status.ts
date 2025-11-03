import Component from '@glimmer/component';
import { service } from '@ember/service';
import type RoverSensorService from '@robot/control-center/services/rover-sensor';

interface SensorStatusArgs {}

export default class SensorStatus extends Component<SensorStatusArgs> {
  @service declare roverSensor: RoverSensorService;

  get variant() {
    if (
      this.roverSensor.armFreqCapped ||
      this.roverSensor.throttled ||
      this.roverSensor.softTemperatureLimit ||
      this.roverSensor.underVoltage
    ) {
      return 'danger';
    }

    if (
      this.roverSensor.armFreqCappedOccurred ||
      this.roverSensor.throttledOccurred ||
      this.roverSensor.softTemperatureLimitOccurred ||
      this.roverSensor.underVoltageOccurred
    ) {
      return 'warning';
    }
  }
}
