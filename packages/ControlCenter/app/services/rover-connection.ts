import Service from '@ember/service';
import { io } from 'socket.io-client';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { EventEmitter } from 'eventemitter3';

import type { Socket } from 'socket.io-client';
import type { ControlCommand, EventsTypesMapping } from '@robot/shared/events';
import type { CameraConfig } from '@robot/shared/camera';

// Interval to check latency with our rover
const latency_check_interval = 500;

export default class RoverConnexionService extends Service {
  socket?: Socket;

  @tracked connected = false;
  private eventEmitter = new EventEmitter<EventsTypesMapping>();

  // proxy event emitter on/off methods
  on = this.eventEmitter.on.bind(this.eventEmitter) as typeof this.eventEmitter.on;
  off = this.eventEmitter.on.bind(this.eventEmitter) as typeof this.eventEmitter.on;

  async pingRover(address: string): Promise<true> {
    try {
      const data = await fetch(`http://${address}:3000/ping`);
      const response = await data.text();

      if (response !== 'rover-pong') {
        throw `Error on rover ping response, received: ${response}`;
      } else {
        return true;
      }
    } catch (e) {
      throw `Error during rover ping : ${e}`;
    }
  }

  @action
  connect(address: string) {
    console.log(`connecting to rover on ${address}:3000...`);
    this.socket = io(`${address}:3000`);
    this.socket.on('connect', () => {
      console.log('connected to rover.');
      this.connected = true;
      this.startLatency();
    });

    this.socket.on('disconnect', () => {
      console.log('disconnected from rover.');
      this.connected = false;
      this.stopLatency();
    });

    // proxy event to our event Emitter
    this.socket.onAny((eventName, ...args) => {
      if (eventName === 'pong') {
        this.handleLatencyResponse();
        return;
      }
      this.eventEmitter.emit(eventName, ...args);
    });

    // on('piSensor', function (data) {
    //   debugger;
    //   console.log('piSensor', data);
    // });
  }

  @tracked
  roverLatency?: number;

  latencyInterval?: NodeJS.Timeout;
  lastPingTiming?: number;
  latency: number = 0;

  @action
  startLatency() {
    this.latencyInterval = setInterval(this.sendLatency, latency_check_interval);
  }

  @action
  stopLatency() {
    if (this.latencyInterval) {
      clearInterval(this.latencyInterval);
    }
  }

  @action
  sendLatency() {
    if (this.connected && this.socket && !this.lastPingTiming) {
      this.lastPingTiming = new Date().getTime();
      this.socket.emit('ping');
    }
  }

  @action
  handleLatencyResponse() {
    const responseTiming = new Date().getTime();
    const { lastPingTiming } = this;
    this.lastPingTiming = undefined;

    this.latency = responseTiming - (lastPingTiming as number);
  }

  sendControlCommand(data: ControlCommand) {
    if (!this.connected) {
      return;
    }
    this.socket?.emit('controlCommand', data);
  }

  sendUpdateCameraSettingsCommand(settings: CameraConfig) {
    if (!this.connected) {
      return;
    }

    this.socket?.emit('updateCameraSettings', settings);
  }

  @action
  disconnect() {
    this.socket?.disconnect();
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'rover-connection': RoverConnexionService;
  }
}
