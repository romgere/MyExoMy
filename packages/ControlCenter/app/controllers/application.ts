import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import LocomotionMode from '@robot/shared/locomotion-modes';

import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type GamepadService from '@robot/control-center/services/gamepad';
import type { PS4ContollerAxes } from '@robot/control-center/services/gamepad';

export default class ApplicationController extends Controller {
  @service declare roverConnection: RoverConnectionService;
  @service declare gamepad: GamepadService;

  LocomotionMode = LocomotionMode;

  @tracked locomotionMode: LocomotionMode = LocomotionMode.ACKERMANN;
  lastDefaultLocomotionMode: LocomotionMode = LocomotionMode.ACKERMANN;

  joystickData: [number, number] = [0, 0];
  interval?: NodeJS.Timeout;

  @tracked roverAddress = 'rover.local:3000';

  constructor(...args: ConstructorParameters<typeof Controller>) {
    super(...args);
    // bind
    this.gamepad.on('joyEnd', this.onJoyEnd);
    this.gamepad.on('joyMove', this.onJoyMove);
    this.gamepad.on('buttonChange', (buttons) => {
      if (buttons.leftStick) {
        this.locomotionMode =
          this.locomotionMode === LocomotionMode.ACKERMANN
            ? LocomotionMode.FAKE_ACKERMANN
            : LocomotionMode.ACKERMANN;

        this.lastDefaultLocomotionMode = this.locomotionMode;
      }
    });
  }

  startSending() {
    if (!this.interval) {
      this.interval = setInterval(this.sendCommand, 50);
    }
  }

  stopSending() {
    clearInterval(this?.interval);
    this.interval = undefined;
    this.joystickData = [0, 0];
    this.sendCommand();
  }

  @action
  sendCommand(toggleMotors: boolean = false) {
    this.roverConnection.sendControlCommand({
      axes: this.joystickData,
      locomotionMode: this.locomotionMode,
      toggleMotors,
    });
  }

  @action
  sendUpdateCameraSettingsCommand() {
    this.roverConnection.sendUpdateCameraSettingsCommand();
  }

  @action
  onVJoyMove(data: [number, number]) {
    this.joystickData = data;
    this.startSending();
  }

  @action
  onVJoyEnd() {
    this.stopSending();
  }

  @action
  onJoyMove(axes: PS4ContollerAxes) {
    // Ackerman mode (or fake Ackerman)
    if (axes.leftStick[0] || axes.leftStick[1]) {
      this.locomotionMode = this.lastDefaultLocomotionMode;
      this.joystickData = [-axes.leftStick[0], -axes.leftStick[1]];
    }
    // Crabbing
    else if (axes.rightStick[0] || axes.rightStick[1]) {
      this.locomotionMode = LocomotionMode.CRABBING;
      this.joystickData = [-axes.rightStick[0], -axes.rightStick[1]];
    }
    // sport turn
    else if (axes.trigger[0] || axes.trigger[1]) {
      this.locomotionMode = LocomotionMode.POINT_TURN;
      this.joystickData = [axes.trigger[0] ? axes.trigger[0] : -axes.trigger[1], 0];
    }

    this.startSending();
  }

  @action
  onJoyEnd() {
    this.stopSending();
  }

  @action
  changeDrivingMode(locomotionMode: LocomotionMode) {
    debugger;
    this.locomotionMode = locomotionMode;
    this.sendCommand();
  }

  @action
  crabbing() {
    this.locomotionMode = LocomotionMode.CRABBING;
    this.sendCommand();
  }

  @action
  spotTurn() {
    this.locomotionMode = LocomotionMode.POINT_TURN;
    this.sendCommand();
  }

  @action
  ackermann() {
    this.locomotionMode = LocomotionMode.ACKERMANN;
    this.sendCommand();
  }

  @action
  fakeAckermann() {
    this.locomotionMode = LocomotionMode.FAKE_ACKERMANN;
    this.sendCommand();
  }

  @action
  motors() {
    this.sendCommand(true);
  }

  @action
  connect() {
    this.roverConnection.connect(`ws://${this.roverAddress}`);
  }

  @action
  disconnect() {
    this.roverConnection.disconnect();
  }

  @action
  updateRoverAddress(e: InputEvent) {
    this.roverAddress = (e.target as HTMLInputElement).value;
  }
}

declare module '@ember/controller' {
  interface Registry {
    application: ApplicationController;
  }
}
