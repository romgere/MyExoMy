import Service from './-base.js';

const {
  min,
  sqrt,
  atan2,
  PI
} = Math

import type { ControlCommand } from "@exomy/event-types/events.js";
import type { MotorAngle, MotorSpeed } from "@exomy/event-types/types.js"
import { LocomotionMode } from '@exomy/event-types/locomotion-modes.js';

/**
 * This received control commands & convert them to rover command
 */
class ControlService extends Service {
  static serviceName = 'control';

  // Keep ref to current locomotion mode
  locomotionMode = LocomotionMode.ACKERMANN;
  motorsEnabled = true;

  async init() {
    this.eventBroker.on('controlCommand', this.onControlCommand.bind(this));
  }

  onControlCommand(command: ControlCommand) {
    this.logger.info('onControlCommand', command);
    
    const { 
      axes: [x, y],
      buttons: {
        locomotionMode1,
        locomotionMode2,
        locomotionMode3,
        toggleMotors
      }
    } = command;

    // Reading out button data to set locomotion mode
    if (locomotionMode1) {
      this.locomotionMode = LocomotionMode.POINT_TURN
    } else if (locomotionMode2) { 
      this.locomotionMode = LocomotionMode.ACKERMANN
    } else if (locomotionMode3) { 
      this.locomotionMode = LocomotionMode.CRABBING
    }

    // Enable and disable motors
    if (toggleMotors) {
      this.motorsEnabled = !this.motorsEnabled
      this.logger.info(`Motors ${this.motorsEnabled ? 'enabled' : 'disabled'}!`)
    }
    

    // The velocity is decoded as value between 0...100
    let velocity = 100 * min(sqrt(x * x + y * y), 1)

    // The steering is described as an angle between -180...180
    // Which describe the joystick position as follows:
    //   +90
    // 0      +-180
    //   -90
    let steering = atan2(y, x) * 180.0 / PI
    
    this.eventBroker.emit('roverCommand', {
      connected: true,
      motorsEnabled: this.motorsEnabled,
      locomotionMode: this.locomotionMode,
      velocity,
      steering,
    })
  }
}

export default ControlService;
