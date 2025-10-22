import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type RouterService from '@ember/routing/router-service';

export type ControlRouteModel = {
  roverApiAddress: string;
  roverCameraAddress: string;
  testMode: boolean;
  wanMode: boolean;
};

export default class Control extends Route {
  @service declare roverConnection: RoverConnectionService;
  @service declare router: RouterService;

  async model(params: {
    roverApiAddress: string;
    roverCameraAddress: string;
    testMode: string;
    wanMode: string;
  }): Promise<ControlRouteModel> {
    // No rover address yet, redirect to "connect" route
    if (!(params.roverApiAddress && params.roverCameraAddress) && !params.testMode) {
      this.router.transitionTo('connect');
    }

    if (params.testMode === '1') {
      return {
        roverApiAddress: 'test.mode',
        roverCameraAddress: 'test.mode',
        testMode: true,
        wanMode: false,
      };
    }

    // if rover does not answer, redirect to "connect" route
    try {
      await this.roverConnection.pingRover(params.roverApiAddress, params.wanMode === '1');
    } catch (e) {
      this.router.transitionTo('connect');
    }

    return {
      roverApiAddress: params.roverApiAddress,
      roverCameraAddress: params.roverCameraAddress,
      wanMode: params.wanMode === '1',
      testMode: false,
    };
  }
}
