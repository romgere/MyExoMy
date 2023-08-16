import Service from './-base.js';
import Motors from '@robot/rover-app/lib/motors.js';

import type EventBroker from '@robot/rover-app/lib/event-broker.js';
import type { ExomyConfig } from '@robot/rover-app/types.js';
import type { MotorCommand } from '@robot/shared/events.js';
import type { Express } from 'express';

const watchdog_timeout = 5000;

class MotorService extends Service {
  static serviceName = 'motor';

  motors: Motors;
  watchdogTimer?: NodeJS.Timeout;

  constructor(config: ExomyConfig, eventBroker: EventBroker, express: Express) {
    super(config, eventBroker, express);
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
    this.watchdogTimer = setTimeout(this.watchdog.bind(this), watchdog_timeout);
  }

  resetWatchdog() {
    clearTimeout(this.watchdogTimer);
    this.watchdogTimer = setTimeout(this.watchdog.bind(this), watchdog_timeout);
  }

  watchdog() {
    this.logger.info('Watchdog fired. Stopping driving motors.');
    this.motors.stopMotors();
  }
}

export default MotorService;
