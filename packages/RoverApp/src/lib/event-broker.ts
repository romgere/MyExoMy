import TypedEventEmitter, { EventMap } from 'typed-emitter';
import EventEmitter from 'events';

import type { EventsTypesHandlersMapping } from '@robot/shared/events.js';

type TypedEmitter<T extends EventMap> = TypedEventEmitter.default<T>;

export default class EventBroker extends (EventEmitter as new () => TypedEmitter<EventsTypesHandlersMapping>) {}
