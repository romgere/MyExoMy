
const rosnodejs = require('rosnodejs');
const { RoverCommand, MotorCommands, Screen } = rosnodejs.require('exomy').msg;
const Rover = require('./rover')

const exomy = Rover()

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
  await rosnodejs.initNode('robot_node')
  rosnodejs.log.info('Starting the robot node')

  rosnodejs.subscribe('/rover_command', RoverCommand, joy_callback, { queueSize: 1 })
  robot_pub = rosnodejs.advertise("/motor_commands", MotorCommands, { queueSize: 1 })
}

if (require.main === module) {
  nodeMain();
}   