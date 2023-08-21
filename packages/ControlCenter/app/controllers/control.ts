import Controller from '@ember/controller';

export default class ControlController extends Controller {
  queryParams = ['roverAddress'];
  roverAddress?: string = undefined;
}

declare module '@ember/controller' {
  interface Registry {
    control: ControlController;
  }
}
