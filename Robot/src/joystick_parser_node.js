#!/usr/bin/env node
'use strict'

const rosnodejs = require('rosnodejs')
const { Joy } = rosnodejs.require('sensor_msgs').msg
const { RoverCommand } = rosnodejs.require('exomy').msg
const {
  locomotionModes
} = require('../misc')

const {
  min,
  sqrt,
  atan2,
  PI
} = Math

// Define locomotion modes
let locomotionMode = 1 // ACKERMANN
let motorsEnabled = true

let commandPub

function joyCallback(data) {
  rosnodejs.log.info(`joystick_parser_node data receive ${JSON.stringify(data)}`)

  const roverCmd = new RoverCommand()

  // Function map for the Logitech F710 joystick
  // Button on pad | function
  // --------------|----------------------
  // A             | Ackermann mode
  // X             | Point turn mode
  // Y             | Crabbing mode
  // Left Stick    | Control speed and direction
  // START Button  | Enable and disable motors

  // Reading out joystick data
  const [x, y] = data.axes

  // Reading out button data to set locomotion mode
  if (data.buttons[0] == 1) { // eslint-disable-line eqeqeq
    // X Button
    locomotionMode = locomotionModes.POINT_TURN
  } else if (data.buttons[1] == 1) { // eslint-disable-line eqeqeq
    // A Button
    locomotionMode = locomotionModes.ACKERMANN
  } else if (data.buttons[3] == 1) { // eslint-disable-line eqeqeq
    // Y Button
    locomotionMode = locomotionModes.CRABBING
  }
  roverCmd.locomotion_mode = locomotionMode

  // Enable and disable motors
  // START Button
  if (data.buttons[9] == 1) { // eslint-disable-line eqeqeq
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
  const joystickNode = await rosnodejs.initNode('joystick_parser_node')
  rosnodejs.log.info('Starting the joystick_parser node')

  joystickNode.subscribe('/joy', Joy, joyCallback, { queueSize: 1 })
  commandPub = joystickNode.advertise('/rover_command', RoverCommand, { queueSize: 1 })
}

if (require.main === module) {
  nodeMain()
}
