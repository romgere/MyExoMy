import readConfig from '@robot/rover-app/helpers/read-config.js';
import EventBroker from '@robot/rover-app/lib/event-broker.js';
import logger from '@robot/rover-app/lib/logger.js';

import services from '@robot/rover-app/services/index.js';
import type Service from '@robot/rover-app/services/-base.js';

import type { ExomyConfig } from '@robot/rover-app/types.js';

let config: ExomyConfig;
let eventBroker: EventBroker;
const serviceInstances: Service[] = [];

async function main() {
  logger.info('Starting...');

  config = await readConfig();
  eventBroker = new EventBroker();

  // Instanciates & init services
  for (const ServiceClass of services) {
    logger.info(`Starting "${ServiceClass.serviceName}" service...`);

    const service = new ServiceClass(config, eventBroker);
    await service.init();

    logger.info(`"${ServiceClass.serviceName}" service started.`);

    serviceInstances.push(service);
  }
}

await main();
