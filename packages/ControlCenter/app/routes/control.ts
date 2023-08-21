import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type RouterService from '@ember/routing/router-service';

export default class Control extends Route {
  @service declare roverConnection: RoverConnectionService;
  @service declare router: RouterService;

  async model(params: { roverAddress: string }): Promise<string> {
    // No rover address yet, redirect to "connect" route
    if (!params.roverAddress) {
      this.router.transitionTo('connect');
    }

    // if rover does not answer, redirect to "connect" route
    try {
      await this.roverConnection.pingRover(params.roverAddress);
    } catch (e) {
      this.router.transitionTo('connect');
    }

    return params.roverAddress;
  }
}
