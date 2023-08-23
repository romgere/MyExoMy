import Component from '@glimmer/component';
import { service } from '@ember/service';

import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type GamepadService from '@robot/control-center/services/gamepad';

interface Args {}

export default class ConnectionStatusComponent extends Component<Args> {
  @service declare roverConnection: RoverConnectionService;
  @service declare gamepad: GamepadService;
}
