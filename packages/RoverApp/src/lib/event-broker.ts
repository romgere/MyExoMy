import EventEmitter from 'events';

import type { EventsTypesMapping } from '@robot/shared/events.js';

type EventBrokerEventEmiter = {
  on<E extends keyof EventsTypesMapping>(
    eventName: E,
    listener: (payload: EventsTypesMapping[E]) => void,
  ): void;
  emit<E extends keyof EventsTypesMapping>(eventName: E, payload: EventsTypesMapping[E]): void;
};

export default class EventBroker extends (EventEmitter as new () => EventBrokerEventEmiter) {}
