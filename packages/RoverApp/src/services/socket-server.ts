import SocketServer from '@robot/rover-app/lib/socket-server.js';
import Service from './-base.js';
import { httpServerCorsOrigin } from '@robot/rover-app/lib/const.js';

import type { RoverCommand, ControlCommand } from '@robot/shared/events.js';

type ServerEvent = {
  roverCommand: (cmd: RoverCommand) => void;
  controlCommand: (cmd: ControlCommand) => void;
};

class SocketServerService extends Service {
  static serviceName = 'socket server';
  server?: SocketServer<ServerEvent>;

  async init() {
    this.server = new SocketServer<ServerEvent>(this.httpServer.server, httpServerCorsOrigin);

    // Proxy incomming socket command to other services through event broker
    this.server.on('controlCommand', (cmd) => {
      this.eventBroker.emit('controlCommand', cmd);
    });

    this.server.on('roverCommand', (cmd) => {
      this.eventBroker.emit('roverCommand', cmd);
    });
  }
}

export default SocketServerService;
