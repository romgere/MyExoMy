import readConfig from '@robot/rover-app/helpers/read-config.js';
import logger from '@robot/rover-app/lib/logger.js';
import serviceRegistry, { ServicesClass } from '@robot/rover-app/services/index.js';
import { Worker } from 'worker_threads';
import path from 'path';
import { EventsTypesMapping } from '@robot/shared/events.js';
import type {
  ExomyConfig,
  ServiceWorkerData,
  ServiceWorkerMessage,
} from '@robot/rover-app/types.js';
import SerialATCommandService from './services/serial-at-command.ts';

const THREAD_SERVICE_WORKER_FILE = path.resolve(
  process.cwd(),
  'src/helpers/boot-service-worker.ts',
);

class RoverMain {
  private logger = logger('rover-main');
  private config: ExomyConfig;
  private serviceInstances: Record<string, { worker: Worker; serviceClass: ServicesClass }> = {};

  constructor() {
    this.logger.info('Starting...');
    this.config = readConfig();
  }

  startServices() {
    for (const serviceName in serviceRegistry) {
      // Start thread worker for each service
      this.startServiceWorker(serviceName, this.config);
    }
  }

  private onWorkerMessage = <E extends keyof EventsTypesMapping>(
    sender: Worker,
    messageFromWorker: ServiceWorkerMessage<EventsTypesMapping, E>,
  ) => {
    // proxy message to other workers
    const { name, payload } = messageFromWorker;
    Object.values(this.serviceInstances).forEach(({ worker }) => {
      if (worker !== sender) {
        worker.postMessage({
          name,
          payload,
        } satisfies ServiceWorkerMessage<EventsTypesMapping, E>);
      }
    });
  };

  private async onWorkerError(worker: Worker, serviceName: string, e: Error) {
    this.logger.error(`Service ${serviceName}: error`, e);

    try {
      this.logger.info(`Service ${serviceName}: terminating...`);
      await worker.terminate();
    } finally {
      this.logger.info(`Service ${serviceName}: terminated.`);
    }
  }

  private async restartService(serviceName: string) {
    delete this.serviceInstances[serviceName];

    this.logger.info(`Service ${serviceName}: restarting...`);

    // Send an alert SMS if any service is restarting (except the one that is supposed to send SMS)
    if (serviceName !== SerialATCommandService.serviceName) {
      const { worker: atServiceworker } = this.serviceInstances[SerialATCommandService.serviceName];

      atServiceworker.postMessage({
        name: 'sendSms',
        payload: {
          content: `Warning - "${serviceName}" service restarted`,
        },
      });
    }

    try {
      await this.startServiceWorker(serviceName, this.config);
      this.logger.info(`Service ${serviceName}: restarted.`);
    } catch (e) {
      this.logger.info(`Service ${serviceName}: error while restarting.`, e);
    }
  }

  private startServiceWorker(serviceName: string, config: ExomyConfig) {
    if (this.serviceInstances[serviceName]) {
      this.logger.error(`Service ${serviceName}: already stared!`);
      return;
    }

    this.logger.info(`Service ${serviceName}: starting worker...`);

    const worker = new Worker(THREAD_SERVICE_WORKER_FILE, {
      workerData: {
        config,
        serviceName,
      } satisfies ServiceWorkerData,
      name: serviceName,
    });

    worker.on('online', () => {
      this.logger.info(`Service ${serviceName}: worker online.`);
    });

    worker.on(
      'message',
      <E extends keyof EventsTypesMapping>(msg: ServiceWorkerMessage<EventsTypesMapping, E>) => {
        this.onWorkerMessage(worker, msg);
      },
    );

    worker.on('error', (e) => {
      this.onWorkerError(worker, serviceName, e);
    });

    worker.on('exit', (code) => {
      this.logger.info(`Service ${serviceName}: stopped (code: ${code})`);
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

const roverMain = new RoverMain();
roverMain.startServices();
