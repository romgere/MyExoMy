import Controller from '@ember/controller';

export default class ControlController extends Controller {
  queryParams = ['roverApiAddress', 'roverCameraAddress', 'testMode', 'wanMode'];
  roverApiAddress?: string = undefined;
  roverCameraAddress?: string = undefined;
  testMode: string = '';
  wanMode: string = '';
}

declare module '@ember/controller' {
  interface Registry {
    control: ControlController;
  }
}
