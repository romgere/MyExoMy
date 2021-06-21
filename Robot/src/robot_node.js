#!/usr/bin/env node
'use strict'

const rosnodejs = require('rosnodejs')
const { RoverCommand, MotorCommands } = rosnodejs.require('exomy').msg
const Rover = require('./rover')

const exomy = new Rover()

let robotPub

function robotCallback(message) {
  const cmds = new MotorCommands()

  if (message.motors_enabled) {
    exomy.setLocomotionMode(message.locomotion_mode)

    cmds.motor_angles = exomy.joystickToSteeringAngle(message.vel, message.steering)
    cmds.motor_speeds = exomy.joystickToVelocity(message.vel, message.steering)
  } else {
    cmds.motor_angles = exomy.joystickToSteeringAngle(0, 0)
    cmds.motor_speeds = exomy.joystickToVelocity(0, 0)
  }

  robotPub.publish(cmds)
}

async function nodeMain() {
  const robotNode = await rosnodejs.initNode('robot_node')
  rosnodejs.log.info('Starting the robot node')

  robotNode.subscribe('/rover_command', RoverCommand, robotCallback, { queueSize: 1 })
  robotPub = robotNode.advertise('/motor_commands', MotorCommands, { queueSize: 1 })
}

if (require.main === module) {
  nodeMain()
}
