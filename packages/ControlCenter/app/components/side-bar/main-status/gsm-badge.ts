import Component from '@glimmer/component';
import { service } from '@ember/service';

import type RoverSensorService from '@robot/control-center/services/rover-sensor';

interface Args {}
export const BATTERY_HIGH = 50;
export const BATTER_MEDIUM = 25;

export default class NetworkBadgeComponent extends Component<Args> {
  @service declare roverSensor: RoverSensorService;

  get icon() {
    switch (this.roverSensor.gsmQuality.quality) {
      case 'Unknown':
        return 'reception-0';
      case 'Marginal':
        return 'reception-1';
      case 'Good':
        return 'reception-2';
      case 'OK':
        return 'reception-3';
      case 'Excellent':
        return 'reception-4';
    }
  }

  get variant() {
    switch (this.roverSensor.gsmQuality.quality) {
      case 'Unknown':
        return 'neutral';
      case 'Marginal':
        return 'danger';
      case 'Good':
        return 'warning';
      case 'OK':
      case 'Excellent':
        return 'success';
    }
  }

  get pulse() {
    return ['Marginal', 'Good'].includes(this.roverSensor.gsmQuality.quality);
  }
}
