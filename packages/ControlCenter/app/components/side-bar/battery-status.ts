import Component from '@glimmer/component';
import { service } from '@ember/service';
import type RoverSensorService from '@robot/control-center/services/rover-sensor';

interface SensorStatusArgs {}

export default class SensorStatus extends Component<SensorStatusArgs> {
  @service declare roverSensor: RoverSensorService;

  get voltageBadgeVariant() {
    const { batteryPercent } = this.roverSensor;
    if (batteryPercent > 50) {
      return 'success';
    } else if (batteryPercent > 25) {
      return 'warning';
    }

    return 'danger';
  }

  get currentBadgeVariant() {
    return 'neutral';
  }

  get powerBadgeVariant() {
    return 'neutral';
  }

  get mainVariant() {
    const variants = [this.voltageBadgeVariant, this.currentBadgeVariant, this.powerBadgeVariant];
    if (variants.includes('danger')) {
      return 'danger';
    } else if (variants.includes('warning')) {
      return 'warning';
    } else {
      return undefined;
    }
  }

  get volt() {
    return this.roverSensor.batteryVolt.toFixed(2);
  }

  get current() {
    return this.roverSensor.current.toFixed(0);
  }

  get power() {
    return (this.roverSensor.power / 1000).toFixed(2);
  }
}
