import { service } from '@ember/service';
import Component from '@glimmer/component';
import LocomotionMode from '@robot/shared/locomotion-modes';
import type RoverConnectionService from '@robot/control-center/services/rover-connection';

interface Args {
  locomotionMode: LocomotionMode;
  changeDrivingMode: (d: LocomotionMode) => void;
  connect: () => void;
  disconnect: () => void;
  motors: () => void;
  openCameraSettings: () => void;
}

export default class RoverSettingsComponent extends Component<Args> {
  LocomotionMode = LocomotionMode;
  @service declare roverConnection: RoverConnectionService;
}
