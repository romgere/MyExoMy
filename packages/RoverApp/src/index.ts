import readConfig from '@robot/rover-app/helpers/read-config.js';
import EventBroker from '@robot/rover-app/lib/event-broker.js';
import logger from '@robot/rover-app/lib/logger.js';
import serviceRegistry, { ServicesClass } from '@robot/rover-app/services/index.js';
import { allEvents } from '@robot/rover-app/const.js';
import { Worker } from 'worker_threads';
import path from 'path';
import { EventsTypesMapping } from '@robot/shared/events.js';
import type {
  ExomyConfig,
  ServiceWorkerData,
  ServiceWorkerMessage,
} from '@robot/rover-app/types.js';

const THREAD_SERVICE_WORKER_FILE = path.resolve(
  process.cwd(),
  'src/helpers/boot-service-worker.ts',
);

class RoverMain {
  // private httpServer = new HttpServer(httpServerPort);
  private eventBroker = new EventBroker();
  private config: ExomyConfig;
  private serviceInstances: Record<string, { worker: Worker; serviceClass: ServicesClass }> = {};

  constructor() {
    this.config = readConfig();
  }

  startServices() {
    for (const serviceName in serviceRegistry) {
      // Start thread worker for each service
      this.startServiceWorker(serviceName, this.config);
    }

    // Register to all event from eventBroker & broadcast them to workers
    allEvents.forEach((eventName) => {
      this.eventBroker.on(eventName, (payload) => this.sendEventToWorkers(eventName, payload));
    });
  }

  private sendEventToWorkers<E extends keyof EventsTypesMapping>(
    eventName: E,
    payload: EventsTypesMapping[E],
  ) {
    Object.values(this.serviceInstances).forEach(({ worker }) => {
      worker.postMessage({
        name: eventName,
        payload,
      } satisfies ServiceWorkerMessage<EventsTypesMapping, E>);
    });
  }

  private onWorkerMessage = <E extends keyof EventsTypesMapping>(
    messageFromWorker: ServiceWorkerMessage<EventsTypesMapping, E>,
  ) => {
    // proxy to event broker
    const { name, payload } = messageFromWorker;
    this.eventBroker.emit(name, payload);
  };

  private async onWorkerError(worker: Worker, serviceName: string, e: Error) {
    logger.error(`Service ${serviceName}: error`, e);

    logger.info(`Service ${serviceName}: terminating...`);

    try {
      await worker.terminate();
    } finally {
      logger.info(`Service ${serviceName}: terminated.`);
    }
  }

  private async restartService(serviceName: string) {
    delete this.serviceInstances[serviceName];

    logger.info(`Service ${serviceName}: restarting...`);
    try {
      await this.startServiceWorker(serviceName, this.config);
      logger.info(`Service ${serviceName}: restarted.`);
    } catch (e) {
      logger.info(`Service ${serviceName}: error while restarting.`, e);
    }
  }

  private startServiceWorker(serviceName: string, config: ExomyConfig) {
    if (this.serviceInstances[serviceName]) {
      logger.error(`Service ${serviceName}: already stared!`);
      return;
    }

    logger.info(`Service ${serviceName}: starting worker...`);

    const worker = new Worker(THREAD_SERVICE_WORKER_FILE, {
      workerData: {
        config,
        serviceName,
      } satisfies ServiceWorkerData,
      name: serviceName,
    });

    worker.on('online', () => {
      logger.info(`Service ${serviceName}: worker online.`);
    });

    worker.on('message', this.onWorkerMessage);

    worker.on('error', (e) => {
      this.onWorkerError(worker, serviceName, e);
    });

    worker.on('exit', (code) => {
      logger.info(`Service ${serviceName}: stopped (code: ${code})`);
      if (code !== 0) {
        this.restartService(serviceName);
      }
    });

    this.serviceInstances[serviceName] = {
      worker,
      serviceClass: serviceRegistry[serviceName],
    };
  }
}

logger.info('Starting...');
const roverMain = new RoverMain();
roverMain.startServices();
