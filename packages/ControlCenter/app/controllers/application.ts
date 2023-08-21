import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import LocomotionMode from '@robot/shared/locomotion-modes';

import type RoverConnexionService from '@robot/control-center/services/rover-connexion';
import type GamepadService from '@robot/control-center/services/gamepad';
import type { PS4ContollerAxes } from '@robot/control-center/services/gamepad';

export default class ApplicationController extends Controller {
  @service declare roverConnexion: RoverConnexionService;
  @service declare gamepad: GamepadService;

  locomotionMode: LocomotionMode = LocomotionMode.ACKERMANN;
  joystickData: [number, number] = [0, 0];
  interval?: NodeJS.Timeout;

  @tracked roverAddress = 'rover.local:3000';

  constructor(...args: ConstructorParameters<typeof Controller>) {
    super(...args);
    // bind
    this.gamepad.on('joyEnd', this.onJoyEnd);
    this.gamepad.on('joyMove', this.onJoyMove);
    this.gamepad.on('buttonChange', (v) => console.log('buttonChange', v));
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
    this.roverConnexion.sendControlCommand({
      axes: this.joystickData,
      locomotionMode: this.locomotionMode,
      toggleMotors,
    });
  }

  @action
  sendUpdateCameraSettingsCommand() {
    this.roverConnexion.sendUpdateCameraSettingsCommand();
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
    // Ackerman mode
    if (axes.leftStick[0] || axes.leftStick[1]) {
      this.locomotionMode = LocomotionMode.ACKERMANN;
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
    this.roverConnexion.connect(`ws://${this.roverAddress}`);
  }

  @action
  disconnect() {
    this.roverConnexion.disconnect();
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
