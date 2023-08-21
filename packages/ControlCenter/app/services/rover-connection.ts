import Service from '@ember/service';
import { io } from 'socket.io-client';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

import type { Socket } from 'socket.io-client';
import type { ControlCommand } from '@robot/shared/events';
import type { CameraConfig } from '@robot/shared/camera';

export default class RoverConnexionService extends Service {
  socket?: Socket;

  @tracked connected = false;

  async pingRover(address: string): Promise<true> {
    try {
      const data = await fetch(`http://${address}/ping`);
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
    this.socket?.emit('controlCommand', data);
  }

  sendUpdateCameraSettingsCommand() {
    if (!this.connected) {
      return;
    }

    const conf: CameraConfig = {
      fps: 25,
      // width: 1920,
      // height: 1080,
      exposureMode: 'fixedfps',
    } as CameraConfig;

    this.socket?.emit('updateCameraSettings', conf);
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
