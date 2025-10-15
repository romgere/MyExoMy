import { parentPort, workerData } from 'worker_threads';
import servicesRegistry from '@robot/rover-app/services/index.js';
import { ServiceWorkerData } from '../types.js';
import logger from '@robot/rover-app/lib/logger.js';

const { config, serviceName } = workerData as ServiceWorkerData;

// Find service to boot
const ServiceClass = servicesRegistry[serviceName];

if (!ServiceClass) {
  throw new Error(`Can't find "${serviceName}" service.`);
} else if (!parentPort) {
  throw new Error(`Can't start service, not in a worker threads`);
}

// Boot service
logger.info(`Service ${serviceName}: initializing...`);
const service = new ServiceClass(parentPort, config);
await service.init();
logger.info(`Service ${serviceName}: ready.`);
