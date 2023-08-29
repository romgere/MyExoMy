import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import HUD, { defaultHudData } from '../utils/simple-hud';
import { service } from '@ember/service';

import type { HUDData } from '../utils/simple-hud';
import type RoverSensorService from '@robot/control-center/services/rover-sensor';
import type RoverConnectionService from '@robot/control-center/services/rover-connection';

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
      altitude: this.roverSensor.smoothedLidarDistance,
      date: `${this.roverConnection.latency} ms`,
      throttle: this.roverSensor.proximity < 100 ? this.roverSensor.proximity / 100 : 1, // just for fun for now
    };
  }

  mountHud = modifier((element: HTMLCanvasElement) => {
    this.hud = new HUD(element, () => this.hudData);
    this.hud.start();
  });
}
