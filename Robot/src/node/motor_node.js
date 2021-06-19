#!/usr/bin/env node
'use strict';

const Motors = require('./motors');

const rosnodejs = require('rosnodejs');
const { MotorCommands } = rosnodejs.require('exomy').msg;

let watchdogTimer = undefined
let motors = undefined


function callback(cmds) {
  motors.setSteering(cmds.motor_angles)
  motors.setDriving(cmds.motor_speeds)

  clearTimeout(watchdogTimer)
  // If this timer runs longer than the duration specified,
  // then watchdog() is called stopping the driving motors.
  watchdogTimer = setTimeout(5000, watchdog)
}

function shutdown() {
  motors.stopMotors()
}

function watchdog(event) {
  rospy.loginfo("Watchdog fired. Stopping driving motors.")
  motors.stopMotors()
}

async function nodeMain() {

  let rosNode = await rosnodejs.initNode('motors')
  
  motors = Motors()
  await motors.init()

  // This node waits for commands from the robot and sets the motors accordingly
  rosnodejs.log.info('Starting the motors node')
  rosnodejs.on('shutdown', shutdown);

  watchdogTimer = setTimeout(1000, watchdog)

  rosNode.subscribe('motor_commands', MotorCommands, callback, { queueSize: 1 })
}

if (require.main === module) {
  nodeMain();
}   
