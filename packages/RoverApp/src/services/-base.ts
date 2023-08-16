import type { ExomyConfig } from '@robot/rover-app/types.js';
import EventBroker from '../lib/event-broker.js';
import logger from '@robot/rover-app/lib/logger.js';

import type { Express } from 'express';

export default abstract class Service {
  config: ExomyConfig;
  eventBroker: EventBroker;
  express: Express;
  logger = logger;

  static serviceName: string;

  constructor(config: ExomyConfig, eventBroker: EventBroker, express: Express) {
    this.config = config;
    this.eventBroker = eventBroker;
    this.express = express;
  }

  abstract init(): Promise<void>;
}
