#!/usr/bin/env node
'use strict'

const rosnodejs = require('rosnodejs')

const {
  positionNames,
  locomotionModes
} = require('../misc')

const {
  atan,
  tan,
  PI,
  min,
  max,
  cos,
  abs,
  pow,
  sqrt
} = Math

const wheelX = 12.0
const wheelY = 20.0
const maxSteeringAngle = 45
const ackermannRMin = wheelY / tan(maxSteeringAngle * PI / 180.0) + wheelX
const ackermannRMax = 250

function degrees(radians) {
  return radians * (180 / PI)
}

function radians(degrees) {
  return degrees * (PI / 180)
}

// Rover class contains all the math and motor control algorithms to move the rover
class Rover {

  locomotionNames = undefined
  locomotionMode = 1 // ACKERMANN

  constructor() {
    // Set locomotion mode name as sting (eg. 1 : "ACKERMANN", ...)
    this.locomotionNames =  Object.keys(locomotionModes).reduce(function(acc, name) {
      acc[locomotionModes[name]] = name
      return acc
    }, {})

    // Set wheel names
    // 0 fl-||-fr 1
    //      ||
    // 2 cl-||-cr 3
    // 4 rl====rr 5
    for (const key in positionNames) {
      this[positionNames[key]] = key
    }
  }

  // Sets the locomotion mode
  setLocomotionMode(mode) {

    if (mode && this.locomotionMode != mode) {
      rosnodejs.log.info(`Set locomotion mode to: ${this.locomotionNames[mode]}`)
      this.locomotionMode = mode
    }
  }

  /**
   * Converts the steering command [angle of joystick] to angles for the different motors
   * @param int drivingCommand: Drive speed command range from -100 to 100
   * @param int steringCommand: Turning radius command with the values 0(left) +90(forward) -90(backward)  +-180(right)
  */
  joystickToSteeringAngle(drivingCommand, steeringCommand) {

    let steeringAngles = [0, 0, 0, 0, 0, 0]

    if (this.locomotionMode == locomotionModes.POINT_TURN) {
      steeringAngles[this.fl] = 45
      steeringAngles[this.fr] = -45
      steeringAngles[this.rl] = -45
      steeringAngles[this.rr] = 45
    } else if (this.locomotionMode == locomotionModes.CRABBING) {

      if (drivingCommand != 0) {
        let wheelDirection = steeringCommand + (steeringCommand > 0 ? -90 : 90)
        wheelDirection = min(max(wheelDirection, -75), 75)

        // set all 6 wheels to same angle
        steeringAngles = steeringAngles.fill(wheelDirection)
      }
    } else if (this.locomotionMode == locomotionModes.ACKERMANN) {

      // No steering if robot is not driving
      if (!drivingCommand) {
        return steeringAngles
      }

      // Scale between min and max Ackermann radius
      let r = 0
      if (cos(radians(steeringCommand)) == 0) {
        r = ackermannRMax
      } else {
        r = ackermannRMax
          - abs(cos(radians(steeringCommand)))
          * (ackermannRMax - ackermannRMin)
      }

      // No steering
      if (r == ackermannRMax) {
        return steeringAngles
      }

      let innerAngle = parseInt(degrees(
        atan(wheelX / (abs(r) - wheelY))
      ))
      let outerAngle = parseInt(degrees(
        atan(wheelX / (abs(r) + wheelY))
      ))

      if (steeringCommand > 90 || steeringCommand < -90) {
        // Steering to the right
        steeringAngles[this.fl] = outerAngle
        steeringAngles[this.fr] = innerAngle
        steeringAngles[this.rl] = -outerAngle
        steeringAngles[this.rr] = -innerAngle
      } else {
        // Steering to the left
        steeringAngles[this.fl] = -innerAngle
        steeringAngles[this.fr] = -outerAngle
        steeringAngles[this.rl] = innerAngle
        steeringAngles[this.rr] = outerAngle
      }
    }

    return steeringAngles
  }

  /**
   * Converts the steering and drive command to the speeds of the individual motors
    * @param int driving_command: Drive speed command range from -100 to 100
    * @param int stering_command: Turning radius command with the values 0(left) +90(forward) -90(backward)  +-180(right)
  */
  joystickToVelocity(drivingCommand, steeringCommand) {

    let motorSpeeds = [0, 0, 0, 0, 0, 0]

    if (this.locomotionMode == locomotionModes.POINT_TURN) {
      let deg = steeringCommand

      if (drivingCommand) {
        if (deg < 85 && deg > -85) {
          // Left turn
          motorSpeeds[this.fl] = -50
          motorSpeeds[this.fr] = 50
          motorSpeeds[this.cl] = -50
          motorSpeeds[this.cr] = 50
          motorSpeeds[this.rl] = -50
          motorSpeeds[this.rr] = 50
        } else if (deg > 95 || deg < -95) {
          // Right turn
          motorSpeeds[this.fl] = 50
          motorSpeeds[this.fr] = -50
          motorSpeeds[this.cl] = 50
          motorSpeeds[this.cr] = -50
          motorSpeeds[this.rl] = 50
          motorSpeeds[this.rr] = -50
        }
      } else {
        // Stop
        motorSpeeds.fill(0)
      }
    } else if (this.locomotionMode == locomotionModes.CRABBING) {
      if (drivingCommand) {
        motorSpeeds.fill(steeringCommand > 0 ? 50 : -50)
      }
    } else if (this.locomotionMode == locomotionModes.ACKERMANN) {
      let v = drivingCommand

      if (steeringCommand < 0) {
        v *= -1
      }

      // Scale between min and max Ackermann radius
      let radius = ackermannRMax
        -  abs(cos(radians(steeringCommand)))
        * (ackermannRMax - ackermannRMin)

      if (v == 0) {
        return motorSpeeds
      }

      if (radius == ackermannRMax) {
        motorSpeeds.fill(v)
      } else {

        let rMax = radius + wheelX

        let a = pow(wheelY, 2)
        let b = pow(abs(radius) + wheelX, 2)
        let c = pow(abs(radius) - wheelX, 2)
        let rMaxFloat = parseFloat(rMax)

        let r1 = sqrt(a + b)
        let r2 = rMaxFloat
        // let r3 = r1
        let r4 = sqrt(a + c)
        let r5 = abs(radius) - wheelX
        // let r6 = r4

        let v1 = parseInt(v)
        let v2 = parseInt(v * r2 / r1)
        let v3 = v1
        let v4 = parseInt(v * r4 / r1)
        let v5 = parseInt(v * r5 / r1)
        let v6 = v4

        if (steeringCommand > 90 || steeringCommand < -90) {
          motorSpeeds = [v1, v2, v3, v4, v5, v6]
        } else {
          motorSpeeds = [v6, v5, v4, v3, v2, v1]
        }
      }
    }

    return motorSpeeds
  }
}

module.exports = Rover
