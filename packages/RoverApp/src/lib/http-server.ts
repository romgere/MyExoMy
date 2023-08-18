import http from 'http';
import express from 'express';

import type { Express } from 'express';

export default class HttpServer {
  server: http.Server;
  expressApp: Express;

  constructor(port: number) {
    this.expressApp = express();
    this.server = http.createServer(this.expressApp);
    this.server.listen(port);

    this.expressApp.get('/', (req, res) => {
      res.send('<h1>Hello from Exomy</h1>');
    });
  }
}
