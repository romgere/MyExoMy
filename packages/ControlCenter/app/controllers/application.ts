import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import type RoverConnexionService from '@robot/control-center/services/rover-connexion';
import type { ControlCommand } from '@robot/shared//events';

type ControlCommandButton = ControlCommand['buttons'];

export default class ApplicationController extends Controller {
  @service declare roverConnexion: RoverConnexionService;

  joystickData: [number, number] = [0, 0];
  interval?: NodeJS.Timeout;

  @tracked roverAddress = 'ws://localhost:3000';

  startSending() {
    if (!this.interval) {
      this.interval = setInterval(this.sendCommand, 50);
    }
  }

  stopSending() {
    clearInterval(this?.interval);
    this.interval = undefined;
  }

  @action
  sendCommand(buttons: Partial<ControlCommandButton> = {}) {
    this.roverConnexion.sendControlCommand({
      axes: this.joystickData,
      buttons: {
        locomotionMode1: false,
        locomotionMode2: false,
        locomotionMode3: false,
        toggleMotors: false,
        ...buttons,
      },
    });
  }

  @action
  onJoyMove(data: [number, number]) {
    this.joystickData = data;
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
  motors() {
    this.sendCommand({
      toggleMotors: true,
    });
  }

  @action
  connect() {
    this.roverConnexion.connect(this.roverAddress);
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
