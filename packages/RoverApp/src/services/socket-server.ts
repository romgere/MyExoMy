import { Server } from 'socket.io';
import Service from './-base.js';
import {
  httpServerCorsOrigin,
  httpServerPort,
  socketAllowedCommand,
  socketProxifiedEvents,
} from '@robot/rover-app/const.js';

import HttpServer from '@robot/rover-app/lib/http-server.js';

class SocketServerService extends Service {
  static serviceName = 'socket server';

  private httpServer = new HttpServer(httpServerPort);
  private io: Server;

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.io = new Server(this.httpServer.server, {
      cors: {
        origin: httpServerCorsOrigin,
      },
    });
  }

  async init() {
    this.httpServer.expressApp.get('/', (req, res) => {
      res.send('<h1>Hello from Exomy</h1>');
    });

    this.httpServer.expressApp.get('/ping', (req, res) => {
      res.send('rover-pong');
    });

    // Proxy io event to eventBroker class
    this.io.on('connection', (socket) => {
      socket.onAny((event, ...args) => {
        if (event === 'ping') {
          socket.emit('pong');
          return;
        }

        if (!socketAllowedCommand.includes(event)) {
          this.logger.error(`Bad "${event}" event received ignoring.`, ...args);
          return;
        }

        this.emit(event, args[0]);
      });
    });

    // Proxy rover event to socket
    for (const eventName of socketProxifiedEvents) {
      this.on(eventName, (...args: unknown[]) => {
        this.io.sockets.emit(eventName, ...args);
      });
    }
  }
}

export default SocketServerService;
