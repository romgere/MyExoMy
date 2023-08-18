import type { ExomyConfig } from '@robot/rover-app/types.js';
import EventBroker from '@robot/rover-app/lib/event-broker.js';
import HttpServer from '@robot/rover-app/lib/http-server.js';
import logger from '@robot/rover-app/lib/logger.js';

export default abstract class Service {
  config: ExomyConfig;
  eventBroker: EventBroker;
  httpServer: HttpServer;
  logger = logger;

  static serviceName: string;

  constructor(config: ExomyConfig, eventBroker: EventBroker, httpServer: HttpServer) {
    this.config = config;
    this.eventBroker = eventBroker;
    this.httpServer = httpServer;
  }

  abstract init(): Promise<void>;
}
