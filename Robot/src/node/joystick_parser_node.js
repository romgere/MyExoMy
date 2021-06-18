#!/usr/bin/env python
const rosnodejs = require('rosnodejs');
const { Joy } = rosnodejs.require('sensor_msgs').msg;
const { RoverCommand } = rosnodejs.require('exomy').msg;
const locomotionModes = require('./locomotion_modes');

const {
  min,
  sqrt,
  atan2,
  PI
} = Math

// Define locomotion modes
let locomotionMode = 1 // ACKERMANN
let motorsEnabled = true

let commandPub = undefined

function joy_callback(data) {

    rosnodejs.log.info(`joystick_parser_node data receive ${JSON.stringify(data)}`)

    let roverCmd = RoverCommand()

    // Function map for the Logitech F710 joystick
    // Button on pad | function
    // --------------|----------------------
    // A             | Ackermann mode
    // X             | Point turn mode
    // Y             | Crabbing mode
    // Left Stick    | Control speed and direction
    // START Button  | Enable and disable motors

    // Reading out joystick data
    y = data.axes[1]
    x = data.axes[0]

    // Reading out button data to set locomotion mode
    let locomotionMode = undefined
    if (data.buttons[0] == 1) {
      // X Button
      locomotionMode = LocomotionMode.POINT_TURN
    } else if (data.buttons[1] == 1) {
      // A Button
      locomotionMode = LocomotionMode.ACKERMANN
    } else if (data.buttons[3] == 1) {
      // Y Button
      locomotionMode = LocomotionMode.CRABBING
    }
    roverCmd.locomotion_mode = locomotionMode

    // Enable and disable motors
    // START Button
    if (data.buttons[9] == 1) {
      motorsEnabled = !motorsEnabled
      rosnodejs.log.info(`Motors ${motorsEnabled ? 'enabled' : 'disabled'}!`)
    }
    roverCmd.motors_enabled = motorsEnabled

    // The velocity is decoded as value between 0...100
    roverCmd.vel = 100 * min(sqrt(x * x + y * y), 1)

    // The steering is described as an angle between -180...180
    // Which describe the joystick position as follows:
    //   +90
    // 0      +-180
    //   -90
    roverCmd.steering = atan2(y, x) * 180.0 / PI
    roverCmd.connected = true

    commandPub.publish(roverCmd)
}


async function nodeMain() {
  await rosnodejs.initNode('joystick_parser_node')
  rosnodejs.log.info('Starting the joystick_parser node')

  rosnodejs.subscribe('/joy', Joy, joy_callback, { queueSize: 1 })
  commandPub = rosnodejs.advertise("/rover_command", RoverCommand, { queueSize: 1 })
}

if (require.main === module) {
  nodeMain();
}   