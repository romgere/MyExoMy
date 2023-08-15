import Service from './-base.js';

const {
  min,
  sqrt,
  atan2,
  PI
} = Math

import type { ControlCommand } from "@exomy/robot/events.js";
import type { MotorAngle, MotorSpeed } from "@exomy/robot/types.js"
import { LocomotionMode } from '../lib/const.js';

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
    
    // Function map for the Logitech F710 joystick
    // Button on pad | function
    // --------------|----------------------
    // A             | Ackermann mode
    // X             | Point turn mode
    // Y             | Crabbing mode
    // Left Stick    | Control speed and direction
    // START Button  | Enable and disable motors

    // Reading out joystick data
    const [x, y] = command.axes
    const [btnX, btnA,, btnY,,,,,, btnStart] = command.buttons;

    // Reading out button data to set locomotion mode
    if (btnX === 1) {
      this.locomotionMode = LocomotionMode.POINT_TURN
    } else if (btnA == 1) { 
      this.locomotionMode = LocomotionMode.ACKERMANN
    } else if (btnY == 1) { 
      this.locomotionMode = LocomotionMode.CRABBING
    }

    // Enable and disable motors
    if (btnStart === 1) {
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
