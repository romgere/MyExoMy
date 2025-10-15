import Service from './-base.js';

const { min, sqrt, atan2, PI } = Math;

import type { ControlCommand } from '@robot/shared/events.js';
import LocomotionMode from '@robot/shared/locomotion-modes.js';

/**
 * This received control commands & convert them to rover command
 */
class ControlService extends Service {
  static serviceName = 'control';

  // Keep ref to current locomotion mode
  locomotionMode = LocomotionMode.ACKERMANN;
  motorsEnabled = true;

  async init() {
    this.on('controlCommand', this.onControlCommand.bind(this));
  }

  onControlCommand(command: ControlCommand) {
    const {
      axes: [x, y],
      locomotionMode,
      toggleMotors,
    } = command;

    this.locomotionMode = locomotionMode;

    // Enable and disable motors
    if (toggleMotors) {
      this.motorsEnabled = !this.motorsEnabled;
      this.logger.info(`Motors ${this.motorsEnabled ? 'enabled' : 'disabled'}!`);
    }

    // The velocity is decoded as value between 0...100
    const velocity = 100 * min(sqrt(x * x + y * y), 1);

    // The steering is described as an angle between -180...180
    // Which describe the joystick position as follows:
    //   +90
    // 0      +-180
    //   -90
    const steering = (atan2(y, x) * 180.0) / PI;

    this.emit('roverCommand', {
      connected: true,
      motorsEnabled: this.motorsEnabled,
      locomotionMode: this.locomotionMode,
      velocity,
      steering,
    });
  }
}

export default ControlService;
