import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RoverConnectionService from '@robot/control-center/services/rover-connection';
import type { ControlRouteModel } from '@robot/control-center/routes/control';

export default class ControlIndex extends Route {
  @service declare roverConnection: RoverConnectionService;

  async model(params: { autoConnect: boolean }): Promise<ControlRouteModel> {
    const model = this.modelFor('control') as ControlRouteModel;

    if (!model.testMode && params.autoConnect) {
      await this.roverConnection.connect(model.roverApiAddress, model.wanMode);
    }

    return model;
  }
}
