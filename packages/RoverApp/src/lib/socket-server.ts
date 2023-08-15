import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import TypedEventEmitter, { EventMap } from 'typed-emitter';
import EventEmitter from 'events';

import type { Express } from 'express';

type TypedEmitter<T extends EventMap> = TypedEventEmitter.default<T>;

export default class SocketServer<T extends EventMap> extends (EventEmitter as {
  new <U extends EventMap>(): TypedEmitter<U>;
})<T> {
  app: Express;
  server: http.Server;
  io: Server;

  constructor(port: number, corsOrigin: string | string[]) {
    super();

    this.app = express();

    this.server = http.createServer(this.app);

    this.io = new Server(this.server, {
      cors: {
        origin: corsOrigin,
      },
    });

    this.server.listen(port);

    this.io.on('connection', (socket) => {
      socket.onAny((event, ...args) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.emit(event, ...(args as any));
      });
    });
  }
}
