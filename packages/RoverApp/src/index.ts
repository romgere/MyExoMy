import readConfig from '@robot/rover-app/helpers/read-config.js';
import EventBroker from '@robot/rover-app/lib/event-broker.js';
import logger from '@robot/rover-app/lib/logger.js';
import express from 'express';
import services from '@robot/rover-app/services/index.js';

import type Service from '@robot/rover-app/services/-base.js';
import type { Express } from 'express';
import type { ExomyConfig } from '@robot/rover-app/types.js';

let config: ExomyConfig;
let eventBroker: EventBroker;
let expressApp: Express;

const serviceInstances: Service[] = [];

async function main() {
  logger.info('Starting...');

  config = await readConfig();
  eventBroker = new EventBroker();

  expressApp = express();

  expressApp.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
  });

  // Instanciates & init services
  for (const ServiceClass of services) {
    logger.info(`Starting "${ServiceClass.serviceName}" service...`);

    const service = new ServiceClass(config, eventBroker, expressApp);
    await service.init();

    logger.info(`"${ServiceClass.serviceName}" service started.`);

    serviceInstances.push(service);
  }
}

await main();
