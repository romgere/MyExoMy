import SocketServerService from './socket-server.js';
import RobotService from './robot.js';
import MotorService from './motor.js';
import ControlService from './control.js';
import CameraService from './camera.js';
import PiSensorService from './pi-sensors.js';
import ExternalSensorService from './external-sensors.js';
import GPSService from './gps.js';

export type ServicesClass =
  | typeof SocketServerService
  | typeof RobotService
  | typeof MotorService
  | typeof ControlService
  | typeof CameraService
  | typeof PiSensorService
  | typeof ExternalSensorService
  | typeof GPSService;

const serviceRegistry: Record<string, ServicesClass> = {
  [SocketServerService.serviceName]: SocketServerService,
  [RobotService.serviceName]: RobotService,
  [MotorService.serviceName]: MotorService,
  [ControlService.serviceName]: ControlService,
  [CameraService.serviceName]: CameraService,
  [PiSensorService.serviceName]: PiSensorService,
  [ExternalSensorService.serviceName]: ExternalSensorService,
  [GPSService.serviceName]: GPSService,
};

export default serviceRegistry;
