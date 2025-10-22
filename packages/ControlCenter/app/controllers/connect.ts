import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

import config from '@robot/control-center/config/environment';
const {
  APP: { roverDefaultAddress, roverDefault4gApiAddress, roverDefault4gCameraAddress },
} = config;

import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type RouterService from '@ember/routing/router-service';

export default class ConnectController extends Controller {
  @service declare router: RouterService;
  @service declare roverConnection: RoverConnectionService;

  @tracked lastError?: string;
  @tracked roverApiAddress = roverDefaultAddress;
  @tracked roverCameraAddress = roverDefaultAddress;
  @tracked wanMode = false;

  @action
  updateRoverApiAddress(e: InputEvent) {
    this.roverApiAddress = (e.target as HTMLInputElement).value;
    if (!this.wanMode) {
      this.roverCameraAddress = this.roverApiAddress;
    }
  }

  @action
  updateRoverCameraAddress(e: InputEvent) {
    this.roverCameraAddress = (e.target as HTMLInputElement).value;
  }

  @action
  toggleWanMode() {
    this.wanMode = !this.wanMode;

    if (this.wanMode) {
      this.roverApiAddress = roverDefault4gApiAddress;
      this.roverCameraAddress = roverDefault4gCameraAddress;
    } else {
      this.roverApiAddress = roverDefaultAddress;
      this.roverCameraAddress = roverDefaultAddress;
    }
  }

  @tracked connecting = false;

  @action
  async connect() {
    this.connecting = true;

    try {
      if (await this.roverConnection.pingRover(this.roverApiAddress, this.wanMode)) {
        this.lastError = undefined;
        this.router.transitionTo('control.index', {
          queryParams: {
            roverApiAddress: this.roverApiAddress,
            roverCameraAddress: this.roverCameraAddress,
            autoConnect: '1',
            wanMode: this.wanMode ? '1' : undefined,
            testMode: undefined,
          },
        });
      }
    } catch (e) {
      this.lastError = `${e}`;
    } finally {
      this.connecting = false;
    }
  }

  @action
  testMode() {
    this.router.transitionTo('control.index', {
      queryParams: {
        testMode: '1',
        autoConnect: undefined,
        roverAddress: undefined,
      },
    });
  }

  @action
  preventDefault(event: Event) {
    event.preventDefault();
  }
}

declare module '@ember/controller' {
  interface Registry {
    connect: ConnectController;
  }
}
