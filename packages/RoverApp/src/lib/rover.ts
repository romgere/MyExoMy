import logger from './logger.js';
import { degrees, radians } from '@robot/rover-app/helpers/math.js';
import { WheelPosition } from './const.js';
const { atan, tan, PI, min, max, cos, abs, pow, sqrt } = Math;

import { LocomotionMode } from '@robot/shared/locomotion-modes.js';

import type { MotorAngle, MotorSpeed } from '@robot/shared/types.js';
import type { DrivingCommand, SteeringCommand } from '@robot/rover-app/types.js';

// TODO: export this to const ?
const wheelX = 12.0;
const wheelY = 20.0;
const maxSteeringAngle = 45;
const ackermannRMin = wheelY / tan((maxSteeringAngle * PI) / 180.0) + wheelX;
const ackermannRMax = 250;
const maxAngleChange = 30;

// Rover class contains all the math and motor control algorithms to move the rover
class Rover {
  // locomotionNames = undefined
  locomotionMode: LocomotionMode = LocomotionMode.ACKERMANN;

  // Workarround to prevent cheap servo to make full rotation
  // In crabbing mode, if the previous wheel direction diff is > 30°
  // => rotate only 30°
  previousWheelDirection = 0;

  // Sets the locomotion mode
  setLocomotionMode(mode: LocomotionMode) {
    if (mode && this.locomotionMode != mode) {
      logger.info(`Set locomotion mode to: ${mode}`);
      this.locomotionMode = mode;
    }
  }

  /**
   * Converts the steering command [angle of joystick] to angles for the different motors
   * @param drivingCommand Drive speed command range from -100 to 100
   * @param steringCommand Turning radius command with the values 0(left) +90(forward) -90(backward)  +-180(right)
   */
  joystickToSteeringAngle(
    drivingCommand: DrivingCommand,
    steeringCommand: SteeringCommand,
  ): MotorAngle {
    let steeringAngles: MotorAngle = [0, 0, 0, 0, 0, 0];

    if (this.locomotionMode == LocomotionMode.POINT_TURN) {
      steeringAngles[WheelPosition.FL] = 45;
      steeringAngles[WheelPosition.FR] = -45;
      steeringAngles[WheelPosition.RL] = -45;
      steeringAngles[WheelPosition.RR] = 45;
    } else if (this.locomotionMode == LocomotionMode.CRABBING) {
      if (drivingCommand != 0) {
        let wheelDirection = steeringCommand + (steeringCommand > 0 ? -90 : 90);
        wheelDirection = min(max(wheelDirection, -90), 90);

        // start cheap servo workarround
        const diff = wheelDirection - this.previousWheelDirection;
        if (abs(diff) > maxAngleChange) {
          wheelDirection =
            diff > 0
              ? this.previousWheelDirection + maxAngleChange
              : this.previousWheelDirection - maxAngleChange;
        }
        this.previousWheelDirection = wheelDirection;
        // end cheap servo workarround

        // set all 6 wheels to same angle
        steeringAngles = steeringAngles.fill(wheelDirection);
      } else {
        this.previousWheelDirection = 0;
      }
    } else if (this.locomotionMode == LocomotionMode.ACKERMANN) {
      // No steering if robot is not driving
      if (!drivingCommand) {
        return steeringAngles;
      }

      // Scale between min and max Ackermann radius
      let r = 0;
      if (cos(radians(steeringCommand)) == 0) {
        r = ackermannRMax;
      } else {
        r = ackermannRMax - abs(cos(radians(steeringCommand))) * (ackermannRMax - ackermannRMin);
      }

      // No steering
      if (r == ackermannRMax) {
        return steeringAngles;
      }

      const innerAngle = degrees(atan(wheelX / (abs(r) - wheelY)));
      const outerAngle = degrees(atan(wheelX / (abs(r) + wheelY)));

      if (steeringCommand > 90 || steeringCommand < -90) {
        // Steering to the right
        steeringAngles[WheelPosition.FL] = outerAngle;
        steeringAngles[WheelPosition.FR] = innerAngle;
        steeringAngles[WheelPosition.RL] = -outerAngle;
        steeringAngles[WheelPosition.RR] = -innerAngle;
      } else {
        // Steering to the left
        steeringAngles[WheelPosition.FL] = -innerAngle;
        steeringAngles[WheelPosition.FR] = -outerAngle;
        steeringAngles[WheelPosition.RL] = innerAngle;
        steeringAngles[WheelPosition.RR] = outerAngle;
      }
    } else if (this.locomotionMode == LocomotionMode.FAKE_ACKERMANN) {
      if (!drivingCommand) {
        // Stop
        steeringAngles[WheelPosition.FL] = 0;
        steeringAngles[WheelPosition.FR] = 0;
        steeringAngles[WheelPosition.CR] = 0;
        steeringAngles[WheelPosition.CL] = 0;
        steeringAngles[WheelPosition.RL] = 0;
        steeringAngles[WheelPosition.RR] = 0;
        return steeringAngles;
      }

      // Drive straight forward
      if (steeringCommand > 80 && steeringCommand < 100) {
        steeringAngles[WheelPosition.FL] = 0;
        steeringAngles[WheelPosition.FR] = 0;
        steeringAngles[WheelPosition.CR] = 0;
        steeringAngles[WheelPosition.CL] = 0;
        steeringAngles[WheelPosition.RL] = 0;
        steeringAngles[WheelPosition.RR] = 0;
      }
      // Drive straight backwards
      else if (steeringCommand < -80 && steeringCommand > -100) {
        steeringAngles[WheelPosition.FL] = 0;
        steeringAngles[WheelPosition.FR] = 0;
        steeringAngles[WheelPosition.CR] = 0;
        steeringAngles[WheelPosition.CL] = 0;
        steeringAngles[WheelPosition.RL] = 0;
        steeringAngles[WheelPosition.RR] = 0;
      }
      // Drive right forwards
      else if (steeringCommand > 100 && steeringCommand <= 180) {
        steeringAngles[WheelPosition.FL] = 45;
        steeringAngles[WheelPosition.FR] = 45;
        steeringAngles[WheelPosition.CR] = 0;
        steeringAngles[WheelPosition.CL] = 0;
        steeringAngles[WheelPosition.RL] = -45;
        steeringAngles[WheelPosition.RR] = -45;
      }
      // Drive right backwards
      else if (steeringCommand < -100 && steeringCommand >= -180) {
        steeringAngles[WheelPosition.FL] = 45;
        steeringAngles[WheelPosition.FR] = 45;
        steeringAngles[WheelPosition.CR] = 0;
        steeringAngles[WheelPosition.CL] = 0;
        steeringAngles[WheelPosition.RL] = -45;
        steeringAngles[WheelPosition.RR] = -45;
      }
      // Drive left forwards
      else if (steeringCommand < 80 && steeringCommand >= 0) {
        steeringAngles[WheelPosition.FL] = -45;
        steeringAngles[WheelPosition.FR] = -45;
        steeringAngles[WheelPosition.CR] = 0;
        steeringAngles[WheelPosition.CL] = 0;
        steeringAngles[WheelPosition.RL] = 45;
        steeringAngles[WheelPosition.RR] = 45;
      }
      // Drive left backwards
      else if (steeringCommand < 0 && steeringCommand > -80) {
        steeringAngles[WheelPosition.FL] = -45;
        steeringAngles[WheelPosition.FR] = -45;
        steeringAngles[WheelPosition.CR] = 0;
        steeringAngles[WheelPosition.CL] = 0;
        steeringAngles[WheelPosition.RL] = 45;
        steeringAngles[WheelPosition.RR] = 45;
      }
      return steeringAngles;
    }

    return steeringAngles;
  }

  /**
   * Converts the steering and drive command to the speeds of the individual motors
   * @param drivingCommand Drive speed command range from -100 to 100
   * @param steringCommand Turning radius command with the values
   */
  joystickToSpeed(drivingCommand: DrivingCommand, steeringCommand: SteeringCommand): MotorSpeed {
    let motorSpeeds: MotorSpeed = [0, 0, 0, 0, 0, 0];

    if (this.locomotionMode == LocomotionMode.POINT_TURN) {
      const deg = steeringCommand;

      if (drivingCommand) {
        if (deg < 85 && deg > -85) {
          // Left turn
          motorSpeeds[WheelPosition.FL] = -drivingCommand * 0.75;
          motorSpeeds[WheelPosition.FR] = drivingCommand * 0.75;
          motorSpeeds[WheelPosition.CL] = -drivingCommand * 0.75;
          motorSpeeds[WheelPosition.CR] = drivingCommand * 0.75;
          motorSpeeds[WheelPosition.RL] = -drivingCommand * 0.75;
          motorSpeeds[WheelPosition.RR] = drivingCommand * 0.75;
        } else if (deg > 95 || deg < -95) {
          // Right turn
          motorSpeeds[WheelPosition.FL] = drivingCommand * 0.75;
          motorSpeeds[WheelPosition.FR] = -drivingCommand * 0.75;
          motorSpeeds[WheelPosition.CL] = drivingCommand * 0.75;
          motorSpeeds[WheelPosition.CR] = -drivingCommand * 0.75;
          motorSpeeds[WheelPosition.RL] = drivingCommand * 0.75;
          motorSpeeds[WheelPosition.RR] = -drivingCommand * 0.75;
        }
      } else {
        // Stop
        motorSpeeds.fill(0);
      }
    } else if (this.locomotionMode == LocomotionMode.CRABBING) {
      if (drivingCommand) {
        motorSpeeds.fill(steeringCommand > 0 ? drivingCommand : -drivingCommand);
      }
    } else if (this.locomotionMode == LocomotionMode.ACKERMANN) {
      let v = drivingCommand;

      if (steeringCommand < 0) {
        v *= -1;
      }

      // Scale between min and max Ackermann radius
      const radius =
        ackermannRMax - abs(cos(radians(steeringCommand))) * (ackermannRMax - ackermannRMin);

      if (v == 0) {
        return motorSpeeds;
      }

      if (radius == ackermannRMax) {
        motorSpeeds.fill(v);
      } else {
        const rMax = radius + wheelX;

        const a = pow(wheelY, 2);
        const b = pow(abs(radius) + wheelX, 2);
        const c = pow(abs(radius) - wheelX, 2);
        const rMaxFloat = rMax;

        const r1 = sqrt(a + b);
        const r2 = rMaxFloat;
        // let r3 = r1
        const r4 = sqrt(a + c);
        const r5 = abs(radius) - wheelX;
        // let r6 = r4

        const v1 = v;
        const v2 = (v * r2) / r1;
        const v3 = v1;
        const v4 = (v * r4) / r1;
        const v5 = (v * r5) / r1;
        const v6 = v4;

        if (steeringCommand > 90 || steeringCommand < -90) {
          motorSpeeds = [v1, v2, v3, v4, v5, v6];
        } else {
          motorSpeeds = [v6, v5, v4, v3, v2, v1];
        }
      }
    } else if (this.locomotionMode === LocomotionMode.FAKE_ACKERMANN) {
      if (drivingCommand > 0 && steeringCommand >= 0) {
        motorSpeeds[WheelPosition.FL] = 50;
        motorSpeeds[WheelPosition.FR] = 50;
        motorSpeeds[WheelPosition.CR] = 50;
        motorSpeeds[WheelPosition.CL] = 50;
        motorSpeeds[WheelPosition.RL] = 50;
        motorSpeeds[WheelPosition.RR] = 50;
      } else if (drivingCommand > 0 && steeringCommand <= 0) {
        motorSpeeds[WheelPosition.FL] = -50;
        motorSpeeds[WheelPosition.FR] = -50;
        motorSpeeds[WheelPosition.CR] = -50;
        motorSpeeds[WheelPosition.CL] = -50;
        motorSpeeds[WheelPosition.RL] = -50;
        motorSpeeds[WheelPosition.RR] = -50;
      }

      return motorSpeeds;
    }

    return motorSpeeds;
  }
}

export default Rover;
