#!/usr/bin/env node
'use strict';

const rosnodejs = require('rosnodejs');
const { RoverCommand, MotorCommands, Screen } = rosnodejs.require('exomy').msg;
const Rover = require('./rover')

const exomy = new Rover()

let robot_pub = undefined

function joy_callback(message) {
  let cmds = MotorCommands()

  if (message.motors_enabled) {
    exomy.setLocomotionMode(message.locomotion_mode)

    cmds.motor_angles = exomy.joystickToSteeringAngle(message.vel, message.steering)
    cmds.motor_speeds = exomy.joystickToVelocity(message.vel, message.steering)
  } else {
    cmds.motor_angles = exomy.joystickToSteeringAngle(0, 0)
    cmds.motor_speeds = exomy.joystickToVelocity(0, 0)
  }

  robot_pub.publish(cmds)
}


async function nodeMain() {
  let rosNode = await rosnodejs.initNode('robot_node')
  rosnodejs.log.info('Starting the robot node')

  rosNode.subscribe('/rover_command', RoverCommand, joy_callback, { queueSize: 1 })
  robot_pub = rosNode.advertise("/motor_commands", MotorCommands, { queueSize: 1 })
}

if (require.main === module) {
  nodeMain();
}   