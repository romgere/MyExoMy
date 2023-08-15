import Service from './-base.js';
import Rover from '@robot/rover-app/lib/rover.js';

import type { RoverCommand } from '@robot/shared/events.js';
import type { MotorAngle, MotorSpeed } from '@robot/shared/types.js';
/**
 * This received rover commands & convert them to motor instructions
 */
class RobotService extends Service {
  static serviceName = 'robot';
  rover: Rover;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.rover = new Rover();
  }

  async init() {
    this.eventBroker.on('roverCommand', this.onRobotCommand.bind(this));
  }

  onRobotCommand(command: RoverCommand) {
    let motorAngles: MotorAngle;
    let motorSpeeds: MotorSpeed;
    
    this.rover.setLocomotionMode(command.locomotionMode);

    if (command.motorsEnabled) {
      motorAngles = this.rover.joystickToSteeringAngle(command.velocity, command.steering);
      motorSpeeds = this.rover.joystickToSpeed(command.velocity, command.steering);
    } else {
      motorAngles = this.rover.joystickToSteeringAngle(0, 0);
      motorSpeeds = this.rover.joystickToSpeed(0, 0);
    }

    this.eventBroker.emit('motorCommand', { motorSpeeds, motorAngles });
  }
}

export default RobotService;
