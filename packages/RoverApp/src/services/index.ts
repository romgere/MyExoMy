import SocketServerService from './socket-server.js';
import RobotService from './robot.js';
import MotorService from './motor.js';
import ControlService from './control.js';
import CameraService from './camera.js';
import PiSensorService from './pi-sensors.js';
import ExternalSensorService from './external-sensors.js';
import GPSService from './gps.js';
import SerialATCommandService from './serial-at-command.ts';
import SshTunnelService from './ssh-tunnel.ts';
import MiscService from './misc.ts';

export type ServicesClass =
  | typeof SocketServerService
  | typeof RobotService
  | typeof MotorService
  | typeof ControlService
  | typeof CameraService
  | typeof PiSensorService
  | typeof ExternalSensorService
  | typeof GPSService
  | typeof SerialATCommandService
  | typeof SshTunnelService
  | typeof MiscService;

const serviceRegistry: Record<string, ServicesClass> = {
  [SocketServerService.serviceName]: SocketServerService,
  [RobotService.serviceName]: RobotService,
  [MotorService.serviceName]: MotorService,
  [ControlService.serviceName]: ControlService,
  [CameraService.serviceName]: CameraService,
  [PiSensorService.serviceName]: PiSensorService,
  [ExternalSensorService.serviceName]: ExternalSensorService,
  [GPSService.serviceName]: GPSService,
  [SerialATCommandService.serviceName]: SerialATCommandService,
  [SshTunnelService.serviceName]: SshTunnelService,
  [MiscService.serviceName]: MiscService,
};

export default serviceRegistry;
