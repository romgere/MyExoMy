import http from 'http';
import { Server } from 'socket.io';
import TypedEventEmitter, { EventMap } from 'typed-emitter';
import EventEmitter from 'events';

type TypedEmitter<T extends EventMap> = TypedEventEmitter.default<T>;

export default class SocketServer<T extends EventMap> extends (EventEmitter as {
  new <U extends EventMap>(): TypedEmitter<U>;
})<T> {
  io: Server;

  constructor(server: http.Server, corsOrigin: string | string[]) {
    super();

    this.io = new Server(server, {
      cors: {
        origin: corsOrigin,
      },
    });

    // Proxy io event to current class
    this.io.on('connection', (socket) => {
      socket.onAny((event, ...args) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.emit(event, ...(args as any));
      });
    });
  }
}
