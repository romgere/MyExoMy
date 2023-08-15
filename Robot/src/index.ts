import readConfig from "@exomy/robot/helpers/read-config.js";
import EventBroker from "@exomy/robot/lib/event-broker.js";
import logger from "@exomy/robot/lib/logger.js";

import services from '@exomy/robot/services/index.js';
import type Service from '@exomy/robot/services/-base.js'

import type { ExomyConfig } from '@exomy/robot/types.js'

let config: ExomyConfig;
let eventBroker: EventBroker;
const serviceInstances: Service[] = [];

async function main() {
  logger.info('Starting...')

  config = await readConfig();  
  eventBroker = new EventBroker();

  // Instanciates & init services
  for(const ServiceClass of services) {
    logger.info(`Starting "${ServiceClass.serviceName}" service...`)

    const service = new ServiceClass(config, eventBroker);
    await service.init();

    logger.info(`"${ServiceClass.serviceName}" service started.`)

    serviceInstances.push(service);
  }
}

await main();