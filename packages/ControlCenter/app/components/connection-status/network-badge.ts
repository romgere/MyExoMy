import Component from '@glimmer/component';
import { service } from '@ember/service';

import type RoverSensorService from '@robot/control-center/services/rover-sensor';

interface Args {}
const QUALITY_LOW = 30;
const QUALITY_MEDIUM = 70;

export default class NetworkBadgeComponent extends Component<Args> {
  @service declare roverSensor: RoverSensorService;

  get icon() {
    if (!this.roverSensor.currentIwData) {
      return 'wifi-off';
    }

    const quality = this.roverSensor.networkLinkQuality;
    if (quality < QUALITY_LOW) {
      return 'wifi-1';
    } else if (quality < QUALITY_MEDIUM) {
      return 'wifi-2';
    }

    return 'wifi';
  }
  get badgeVariant() {
    if (!this.roverSensor.currentIwData) {
      return 'neutral';
    }

    const quality = this.roverSensor.networkLinkQuality;
    if (quality < QUALITY_LOW) {
      return 'danger';
    } else if (quality < QUALITY_MEDIUM) {
      return 'warning';
    }

    return 'success';
  }
}
