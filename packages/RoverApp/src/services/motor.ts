import Service from './-base.js';
import Motors from '@robot/rover-app/lib/motors.js';
import { motor_watchdog_timeout, motor_event_update_interval } from '@robot/rover-app/const.js';
import { MotorSpeed, MotorAngle } from '@robot/shared/types.js';
import type { MotorCommand } from '@robot/shared/events.js';

const defaultMotorSpeed: MotorSpeed = [0, 0, 0, 0, 0, 0];
const defaultMotorAngle: MotorAngle = [0, 0, 0, 0, 0, 0];

class MotorService extends Service {
  static serviceName = 'motor';

  motors: Motors;
  watchdogTimer?: NodeJS.Timeout;

  currentMotorSpeed: MotorSpeed = defaultMotorSpeed;
  currentMotorAngle: MotorAngle = defaultMotorAngle;

  eventTimer?: NodeJS.Timeout;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.motors = new Motors(this.config);
  }

  async init() {
    await this.motors.init();
    this.initWatchdog();
    this.startSendingMotorEvent();
    this.on('motorCommand', this.onMotorCommand.bind(this));
  }

  onMotorCommand(cmd: MotorCommand) {
    this.resetWatchdog();
    this.motors.setSteering(cmd.motorAngles);
    this.motors.setDriving(cmd.motorSpeeds);
    this.currentMotorSpeed = cmd.motorSpeeds;
    this.currentMotorAngle = cmd.motorAngles;
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
    this.currentMotorSpeed = defaultMotorSpeed;
    this.currentMotorAngle = defaultMotorAngle;
  }

  startSendingMotorEvent() {
    this.eventTimer = setInterval(this.sendMotorEvent.bind(this), motor_event_update_interval);
  }

  sendMotorEvent() {
    this.emit('motorStatus', {
      motorSpeeds: this.currentMotorSpeed,
      motorAngles: this.currentMotorAngle,
    });
  }
}

export default MotorService;
