import type { ExomyConfig, ServiceWorkerMessage } from '@robot/rover-app/types.js';
import logger from '@robot/rover-app/lib/logger.js';
import { EventsTypesMapping } from '@robot/shared/events.js';
import type { MessagePort } from 'worker_threads';

type ListenerRecord<Events extends EventsTypesMapping> = {
  [P in keyof Events]?: ((payload: Events[P]) => void)[];
};

// export default abstract class Service<T extends EventMap> extends (EventEmitter as new<T>() => TypedEmitter<T>)<T> {
export default abstract class Service {
  static serviceName: string;

  protected config: ExomyConfig;
  protected logger = logger;

  private parentPort: MessagePort;
  private _listeners: ListenerRecord<EventsTypesMapping> = {};

  private _onMessage = <E extends keyof EventsTypesMapping>(
    message: ServiceWorkerMessage<EventsTypesMapping, E>,
  ) => {
    const { name, payload } = message;
    this._listeners[name]?.forEach((listener) => listener(payload));
  };

  on<E extends keyof EventsTypesMapping>(
    eventName: E,
    listener: (payload: EventsTypesMapping[E]) => void,
  ) {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }

    this._listeners[eventName]?.push(listener);
  }

  emit<E extends keyof EventsTypesMapping>(eventName: E, payload: EventsTypesMapping[E]) {
    // Send event to parent thread, event will be broadcast to other service workers
    this.parentPort.postMessage({
      name: eventName,
      payload,
    });
  }

  constructor(parentPort: MessagePort, config: ExomyConfig) {
    this.parentPort = parentPort;
    this.config = config as ExomyConfig;
    parentPort.on('message', this._onMessage);
  }

  abstract init(): Promise<void>;
}
