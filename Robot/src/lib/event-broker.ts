// Inspired from https://blog.makerx.com.au/a-type-safe-event-emitter-in-node-js/
import EventEmitter from 'events';
import type { EventsNameTypesMapping } from '@exomy/robot/events.js'

export default class EventBroker {
  private emitter = new EventEmitter()

  emit<TEventName extends keyof EventsNameTypesMapping & string>(
    eventName: TEventName,
    eventArg: EventsNameTypesMapping[TEventName]
  ) {
    this.emitter.emit(eventName, eventArg)
  }

  on<TEventName extends keyof EventsNameTypesMapping & string>(
    eventName: TEventName,
    handler: (eventArg: EventsNameTypesMapping[TEventName]) => void
  ) {
    this.emitter.on(eventName, handler as any)
  }

  off<TEventName extends keyof EventsNameTypesMapping & string>(
    eventName: TEventName,
    handler: (eventArg: EventsNameTypesMapping[TEventName]) => void
  ) {
    this.emitter.off(eventName, handler as any)
  }
}