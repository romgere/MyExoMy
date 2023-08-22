import Controller from '@ember/controller';

export default class ControlController extends Controller {
  queryParams = ['roverAddress', 'testMode'];
  roverAddress?: string = undefined;
  testMode: string = '';
}

declare module '@ember/controller' {
  interface Registry {
    control: ControlController;
  }
}
