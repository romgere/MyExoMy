import SocketServer from '@robot/rover-app/lib/socket-server.js';
import Service from './-base.js';

import type { RoverCommand, ControlCommand } from '@robot/shared/events.js';

type ServerEvent = {
  roverCommand: (cmd: RoverCommand) => void;
  controlCommand: (cmd: ControlCommand) => void;
};

class ServerService extends Service {
  static serviceName = 'server';
  server?: SocketServer<ServerEvent>;

  async init() {
    this.server = new SocketServer<ServerEvent>(3000, '*');

    // Proxy incomming socket command to other services through event broker
    this.server.on('controlCommand', (cmd) => {
      this.eventBroker.emit('controlCommand', cmd);
    });

    this.server.on('roverCommand', (cmd) => {
      this.eventBroker.emit('roverCommand', cmd);
    });

    // robotServer.app.get('/', (req, res) => {
    //   res.send('<h1>Hello world</h1>');
    // });
  }
}

export default ServerService;
