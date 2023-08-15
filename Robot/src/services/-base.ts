import type { ExomyConfig } from '@exomy/robot/types.js'
import EventBroker from '../lib/event-broker.js'
import logger from "@exomy/robot/lib/logger.js";

export default abstract class Service {
  config: ExomyConfig;
  eventBroker: EventBroker;
  logger = logger;

  static serviceName: string;

  constructor(config: ExomyConfig, eventBroker: EventBroker) {
    this.config = config;
    this.eventBroker = eventBroker;
  }

  abstract init(): Promise<void> ;
}