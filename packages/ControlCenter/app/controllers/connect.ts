import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

import config from '@robot/control-center/config/environment';
const {
  APP: { roverDefaultAddress },
} = config;

import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type RouterService from '@ember/routing/router-service';

export default class ConnectController extends Controller {
  @service declare router: RouterService;
  @service declare roverConnection: RoverConnectionService;

  @tracked lastError?: string;
  @tracked roverAddress = (this.model as string) ?? roverDefaultAddress;

  @action
  updateRoverAddress(e: InputEvent) {
    this.roverAddress = (e.target as HTMLInputElement).value;
  }

  @action
  async connect() {
    try {
      if (await this.roverConnection.pingRover(this.roverAddress)) {
        this.lastError = undefined;
        this.router.transitionTo('control.index', {
          queryParams: {
            roverAddress: this.roverAddress,
          },
        });
      }
    } catch (e) {
      this.lastError = `Error during rover ping : ${e}`;
    }
  }
}

declare module '@ember/controller' {
  interface Registry {
    connect: ConnectController;
  }
}
