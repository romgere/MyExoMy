import Service from './-base.js';
import Motors from "@exomy/robot/lib/motors.js";

import type EventBroker from '@exomy/robot/lib/event-broker.js';
import type { ExomyConfig } from "@exomy/robot/types.js"
import type { MotorCommand } from "@exomy/event-types/events.js"

const watchdog_timeout = 5000;

class MotorService extends Service {
  static serviceName = 'motor';
  
  motors: Motors;
  watchdogTimer?: NodeJS.Timeout;

  constructor(config: ExomyConfig, eventBroker: EventBroker) {
    super(config, eventBroker);
    this.motors = new Motors(config);
  }

  async init() {
    await this.motors.init();
    this.eventBroker.on('motorCommand', this.onMotorCommand.bind(this))
  }

  onMotorCommand(cmd: MotorCommand) {
    this.motors.setSteering(cmd.motorAngles);
    this.motors.setDriving(cmd.motorSpeeds);
  }

  initWatchdog() {
    this.watchdogTimer = setTimeout(this.watchdog.bind(this), watchdog_timeout)
  }
  
  resetWatchdog() {
    clearTimeout(this.watchdogTimer)
    this.watchdogTimer = setTimeout(this.watchdog.bind(this), watchdog_timeout)
  }
  
  watchdog() {
    this.logger.info('Watchdog fired. Stopping driving motors.')
    this.motors.stopMotors()
  }
}

export default MotorService;
