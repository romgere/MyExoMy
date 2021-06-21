#!/usr/bin/env node
'use strict'

const Motors = require('./motors')

const rosnodejs = require('rosnodejs')
const { MotorCommands } = rosnodejs.require('exomy').msg

let watchdogTimer,
  motors

function callback(cmds) {
  motors.setSteering(cmds.motor_angles)
  motors.setDriving(cmds.motor_speeds)

  clearTimeout(watchdogTimer)
  // If this timer runs longer than the duration specified,
  // then watchdog() is called stopping the driving motors.
  watchdogTimer = setTimeout(watchdog, 5000)
}

function shutdown() {
  motors.stopMotors()
}

function watchdog() {
  rosnodejs.log.info('Watchdog fired. Stopping driving motors.')
  motors.stopMotors()
}

async function nodeMain() {
  const motorNode = await rosnodejs.initNode('motors')

  motors = new Motors()
  await motors.init(motorNode)

  // This node waits for commands from the robot and sets the motors accordingly
  rosnodejs.log.info('Starting the motors node')
  rosnodejs.on('shutdown', shutdown)
  motorNode.subscribe('motor_commands', MotorCommands, callback, { queueSize: 1 })

  watchdogTimer = setTimeout(watchdog, 1000)
}

if (require.main === module) {
  nodeMain()
}
