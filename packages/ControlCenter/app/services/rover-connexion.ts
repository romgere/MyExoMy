import Service from '@ember/service';
import { io } from 'socket.io-client';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

import type { Socket } from 'socket.io-client';
import type { ControlCommand } from '@robot/shared//events';

export default class RoverConnexionService extends Service {
  socket?: Socket;

  @tracked connected = false;

  @action
  connect(address: string) {
    console.log(`connecting to rover on ${address}...`);
    this.socket = io(address);
    this.socket.on('connect', () => {
      console.log('connected to rover.');
      this.connected = true;
    });
    this.socket.on('disconnect', () => {
      console.log('disconnected from rover.');
      this.connected = false;
    });
  }

  sendControlCommand(data: ControlCommand) {
    if (!this.connected) {
      return;
    }

    console.log('sendControlCommand', data);
    this.socket?.emit('controlCommand', data);
  }

  @action
  disconnect() {
    this.socket?.disconnect();
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'rover-connexion': RoverConnexionService;
  }
}