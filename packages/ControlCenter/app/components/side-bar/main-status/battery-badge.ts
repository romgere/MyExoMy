import Component from '@glimmer/component';
import { service } from '@ember/service';

import type RoverSensorService from '@robot/control-center/services/rover-sensor';

interface Args {}
const BATTERY_HIGHT = 80;
const BATTER_MEDIUM = 40;

export default class NetworkBadgeComponent extends Component<Args> {
  @service declare roverSensor: RoverSensorService;

  get icon() {
    const percent = this.roverSensor.batteryPercent;

    if (percent > BATTERY_HIGHT) {
      return 'battery-full';
    } else if (percent > BATTER_MEDIUM) {
      return 'battery-half';
    }

    return 'battery';
  }

  get badgeVariant() {
    const percent = this.roverSensor.batteryPercent;

    if (percent > BATTERY_HIGHT) {
      return 'success';
    } else if (percent > BATTER_MEDIUM) {
      return 'warning';
    }

    return 'danger';
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
