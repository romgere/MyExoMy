import http from 'http';
import express from 'express';
import cors from 'cors';
import { httpServerCorsOrigin } from '@robot/rover-app/const.js';

import type { Express } from 'express';

export default class HttpServer {
  server: http.Server;
  expressApp: Express;

  constructor(port: number) {
    this.expressApp = express();
    this.server = http.createServer(this.expressApp);
    this.server.listen(port);

    // Set CORS on our app
    this.expressApp.use(
      cors({
        origin: httpServerCorsOrigin,
      }),
    );

    this.expressApp.get('/', (req, res) => {
      res.send('<h1>Hello from Exomy</h1>');
    });

    this.expressApp.get('/ping', (req, res) => {
      res.send('rover-pong');
    });
  }
}
