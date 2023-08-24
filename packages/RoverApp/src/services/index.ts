import SocketServerService from './socket-server.js';
import RobotService from './robot.js';
import MotorService from './motor.js';
import ControlService from './control.js';
import CameraService from './camera.js';
import PiSensorService from './pi-sensors.js';
import ExternalSensorService from './external-sensors.js';

export default [
  SocketServerService,
  RobotService,
  MotorService,
  ControlService,
  CameraService,
  PiSensorService,
  ExternalSensorService,
];
