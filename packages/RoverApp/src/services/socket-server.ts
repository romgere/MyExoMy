import { Server } from 'socket.io';
import Service from './-base.js';
import {
  httpServerCorsOrigin,
  socketAllowedCommand,
  socketProxifiedEvents,
} from '@robot/rover-app/const.js';

import type EventBroker from '@robot/rover-app/lib/event-broker.js';
import type { ExomyConfig } from '@robot/rover-app/types.js';
import type HttpServer from '@robot/rover-app/lib/http-server.js';

class SocketServerService extends Service {
  static serviceName = 'socket server';
  io: Server;

  constructor(config: ExomyConfig, eventBroker: EventBroker, httpsServer: HttpServer) {
    super(config, eventBroker, httpsServer);

    this.io = new Server(httpsServer.server, {
      cors: {
        origin: httpServerCorsOrigin,
      },
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
        this.eventBroker.emit(event, ...args);
      });
    });

    // Proxy rover event to socket
    for (const eventName of socketProxifiedEvents) {
      this.eventBroker.on(eventName, (...args: unknown[]) => {
        this.io.sockets.emit(eventName, ...args);
      });
    }
  }

  async init() {}
}

export default SocketServerService;
