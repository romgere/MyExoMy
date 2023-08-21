import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import type RoverConnexionService from '@robot/control-center/services/rover-connexion';
import type GamepadService from '@robot/control-center/services/gamepad';
import type { PS4ContollerAxes } from '@robot/control-center/services/gamepad';
import type { ControlCommand } from '@robot/shared/events';

type ControlCommandButton = ControlCommand['buttons'];

export default class ApplicationController extends Controller {
  @service declare roverConnexion: RoverConnexionService;
  @service declare gamepad: GamepadService;

  // Virtual joystick
  vJoystickData: [number, number] = [0, 0];
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
    this.vJoystickData = [0, 0];
    this.sendCommand();
  }

  @action
  sendCommand(buttons: Partial<ControlCommandButton> = {}) {
    this.roverConnexion.sendControlCommand({
      axes: this.vJoystickData,
      buttons: {
        locomotionMode1: false,
        locomotionMode2: false,
        locomotionMode3: false,
        locomotionMode4: false,
        toggleMotors: false,
        ...buttons,
      },
    });
  }

  @action
  sendUpdateCameraSettingsCommand() {
    this.roverConnexion.sendUpdateCameraSettingsCommand();
  }

  @action
  onVJoyMove(data: [number, number]) {
    this.vJoystickData = data;
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
      this.sendCommand({
        locomotionMode2: true,
      });
      this.vJoystickData = [-axes.leftStick[0], -axes.leftStick[1]];
    }
    // Crabbing
    else if (axes.rightStick[0] || axes.rightStick[1]) {
      this.sendCommand({
        locomotionMode3: true,
      });
      this.vJoystickData = [-axes.rightStick[0], -axes.rightStick[1]];
    }
    // sport turn
    else if (axes.trigger[0] || axes.trigger[1]) {
      this.sendCommand({
        locomotionMode1: true,
      });
      this.vJoystickData = [axes.trigger[0] ? axes.trigger[0] : -axes.trigger[1], 0];
    }

    this.startSending();
  }

  @action
  onJoyEnd() {
    this.stopSending();
  }

  @action
  crabbing() {
    this.sendCommand({
      locomotionMode3: true,
    });
  }

  @action
  spotTurn() {
    this.sendCommand({
      locomotionMode1: true,
    });
  }

  @action
  ackermann() {
    this.sendCommand({
      locomotionMode2: true,
    });
  }

  @action
  fakeAckermann() {
    this.sendCommand({
      locomotionMode4: true,
    });
  }

  @action
  motors() {
    this.sendCommand({
      toggleMotors: true,
    });
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
