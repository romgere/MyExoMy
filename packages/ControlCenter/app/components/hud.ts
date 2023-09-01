import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import HUD, { defaultHudData } from '../utils/simple-hud';
import { service } from '@ember/service';

import type { HUDData } from '../utils/simple-hud';
import type RoverSensorService from '@robot/control-center/services/rover-sensor';
import type RoverConnectionService from '@robot/control-center/services/rover-connection';

const proximity_threshold = [
  1, // Min for no detection
  10, // Min for level 1
  25, // Min for level 2
  50, // Min for level 3
];

function proximitySensorToHudProximity(value: number) {
  if (value <= proximity_threshold[0]) {
    return 0;
  } else if (value <= proximity_threshold[1]) {
    return 1;
  } else if (value <= proximity_threshold[2]) {
    return 2;
  } else if (value <= proximity_threshold[3]) {
    return 3;
  }
  return 4;
}

interface HudComponentArgs {}

export default class HudComponent extends Component<HudComponentArgs> {
  @service declare roverSensor: RoverSensorService;
  @service declare roverConnection: RoverConnectionService;
  hud?: HUD;

  get hudData(): HUDData {
    return {
      ...defaultHudData,
      pitch: this.roverSensor.smoothedOrientation.pitch * (Math.PI / 180),
      roll: this.roverSensor.smoothedOrientation.roll * (Math.PI / 180),
      heading: this.roverSensor.smoothedOrientation.heading * (Math.PI / 180),
      distance: this.roverSensor.smoothedLidarDistance,
      info1: `${this.roverConnection.latency} ms`,
      proximity: {
        FR: proximitySensorToHudProximity(this.roverSensor.proximity.FR),
        FL: proximitySensorToHudProximity(this.roverSensor.proximity.FL),
        RL: proximitySensorToHudProximity(this.roverSensor.proximity.RL),
        RR: proximitySensorToHudProximity(this.roverSensor.proximity.RR),
      },
      throttle: this.roverSensor.motorStatus.motorSpeeds,
      direction: this.roverSensor.motorStatus.motorAngles,
    };
  }

  mountHud = modifier((element: HTMLCanvasElement) => {
    this.hud = new HUD(element, () => this.hudData);
    this.hud.start();
  });
}
