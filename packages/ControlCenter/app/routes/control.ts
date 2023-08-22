import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type RouterService from '@ember/routing/router-service';

export type ControlRouteModel = {
  roverAddress: string;
  testMode: boolean;
};

export default class Control extends Route {
  @service declare roverConnection: RoverConnectionService;
  @service declare router: RouterService;

  async model(params: { roverAddress: string; testMode: boolean }): Promise<ControlRouteModel> {
    // No rover address yet, redirect to "connect" route
    if (!params.roverAddress && !params.testMode) {
      this.router.transitionTo('connect');
    }

    if (params.testMode) {
      return {
        roverAddress: 'test.mode',
        testMode: true,
      };
    }

    // if rover does not answer, redirect to "connect" route
    try {
      await this.roverConnection.pingRover(params.roverAddress);
    } catch (e) {
      this.router.transitionTo('connect');
    }

    return {
      roverAddress: params.roverAddress,
      testMode: false,
    };
  }
}
