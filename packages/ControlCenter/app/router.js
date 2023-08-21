import EmberRouter from '@ember/routing/router';
import config from '@robot/control-center/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('control', function () {
    this.route('index', { path: '/' });
  });
  this.route('connect');
});
