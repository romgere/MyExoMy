import Service from './-base.js';
import Motors from '@robot/rover-app/lib/motors.js';
import { motor_watchdog_timeout } from '@robot/rover-app/const.js';

import type EventBroker from '@robot/rover-app/lib/event-broker.js';
import type { ExomyConfig } from '@robot/rover-app/types.js';
import type { MotorCommand } from '@robot/shared/events.js';
import type HttpServer from '@robot/rover-app/lib/http-server.js';

class MotorService extends Service {
  static serviceName = 'motor';

  motors: Motors;
  watchdogTimer?: NodeJS.Timeout;

  constructor(config: ExomyConfig, eventBroker: EventBroker, httpsServer: HttpServer) {
    super(config, eventBroker, httpsServer);
    this.motors = new Motors(config);
  }

  async init() {
    await this.motors.init();
    this.initWatchdog();
    this.eventBroker.on('motorCommand', this.onMotorCommand.bind(this));
  }

  onMotorCommand(cmd: MotorCommand) {
    this.motors.setSteering(cmd.motorAngles);
    this.motors.setDriving(cmd.motorSpeeds);
  }

  initWatchdog() {
    this.watchdogTimer = setTimeout(this.watchdog.bind(this), motor_watchdog_timeout);
  }

  resetWatchdog() {
    clearTimeout(this.watchdogTimer);
    this.watchdogTimer = setTimeout(this.watchdog.bind(this), motor_watchdog_timeout);
  }

  watchdog() {
    this.logger.info('Watchdog fired. Stopping driving motors.');
    this.motors.stopMotors();
  }
}

export default MotorService;
