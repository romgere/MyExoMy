import Component from '@glimmer/component';
import { service } from '@ember/service';
import type RoverSensorService from '@robot/control-center/services/rover-sensor';

interface SensorStatusArgs {}

export default class SensorStatus extends Component<SensorStatusArgs> {
  @service declare roverSensor: RoverSensorService;

  get piTemperatureBadgeVariant() {
    const t = this.roverSensor.piTemperature;
    if (t < 50) {
      return 'success';
    } else if (t < 65) {
      return 'warning';
    }

    return 'danger';
  }

  get bodyTemperatureBadgeVariant() {
    const t = this.roverSensor.bodyTemperature;
    if (t < 30) {
      return 'success';
    } else if (t < 40) {
      return 'warning';
    }

    return 'danger';
  }
}
