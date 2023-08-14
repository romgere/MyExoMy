import readConfig from "@exomy/robot/helpers/read-config.js";
import SocketServer from "@exomy/robot/lib/socket-server.js";
import Rover from "@exomy/robot/lib/rover.js";
// import Motors from "@exomy/robot/lib/motors.js";
import logger from "@exomy/robot/lib/logger.js";

import type { MotorAngle, MotorVelocity, ExomyConfig } from "@exomy/robot/types.js"
import type { RoverCommandEvent } from "@exomy/robot/events.js";

const watchdog_timeout = 5000;

let watchdogTimer: NodeJS.Timeout;
let config: ExomyConfig;
let rover: Rover;
// let motors: Motors;


function initWatchdog() {
  watchdogTimer = setTimeout(watchdog, watchdog_timeout)
}

function resetWatchdog() {
  clearTimeout(watchdogTimer)
  watchdogTimer = setTimeout(watchdog, watchdog_timeout)
}

function watchdog() {
  logger.info('Watchdog fired. Stopping driving motors.')
  // motors.stopMotors()
}

// When Rover Command is received 
function onRobotCommand(command: RoverCommandEvent) {
  logger.info('onRobotCommand', command);
  debugger
  resetWatchdog();

  let steeringAngles: MotorAngle;
  let motorsVelocity: MotorVelocity;
  
  if (command.motorsEnabled)  {
    steeringAngles = rover.joystickToSteeringAngle(command.velocity, command.steering)
    motorsVelocity = rover.joystickToVelocity(command.velocity, command.steering)
  } else {
    steeringAngles = rover.joystickToSteeringAngle(0, 0);
    motorsVelocity = rover.joystickToVelocity(0, 0);
  }

  // motors.setSteering(steeringAngles);
  // motors.setDriving(motorsVelocity);

}

async function main() {
  config = await readConfig();

  rover = new Rover();
  // motors = new Motors(config);
  // await motors.init();

  initWatchdog();

  const robotServer = new SocketServer<{ robotCommand: (cmd: RoverCommandEvent) => void }>(3000, 'http://127.0.0.1:8000');  
  robotServer.on('robotCommand', onRobotCommand);

  // robotServer.app.get('/', (req, res) => {
  //   res.send('<h1>Hello world</h1>');
  // });
}

await main();