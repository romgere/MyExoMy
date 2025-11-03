import Service from './-base.js';
import { exec } from 'child_process';

import type { IncomingSMSEvent } from '@robot/shared/events.js';

class MiscService extends Service {
  static serviceName = 'miscellaneous';

  async init() {
    this.on('incomingSms', this._onSms);
  }

  private _onSms = async (sms: IncomingSMSEvent) => {
    switch (sms.content.toLowerCase()) {
      case 'wifi-start':
      case 'wifi-on':
      case 'wifistart':
      case 'wifion':
        try {
          await this.toggleWifi('up');
          await this.emit('sendSms', { content: 'Wifi started' });
        } catch (e) {
          this.logger.error('Error starting Wifi', e);
          await this.emit('sendSms', { content: 'Error while starting Wifi' });
        }
        break;
      case 'wifi-stop':
      case 'wifi-off':
      case 'wifistop':
      case 'wifioff':
        try {
          await this.toggleWifi('down');
          await this.emit('sendSms', { content: 'Wifi stopped' });
        } catch (e) {
          this.logger.error('Error starting Wifi', e);
          await this.emit('sendSms', { content: 'Error while stopping Wifi' });
        }
        break;
      case 'reboot':
      case 'restart':
        try {
          await this.emit('sendSms', { content: 'Rover will restart...' });
          await this.restart();
        } catch (e) {
          this.logger.error('Error restarting', e);
          await this.emit('sendSms', { content: 'Error while restarting Wifi' });
        }
        break;
      case 'stop':
      case 'halt':
        try {
          await this.emit('sendSms', { content: 'Rover will stop...' });
          await this.halt();
        } catch (e) {
          this.logger.error('Error restarting', e);
          await this.emit('sendSms', { content: 'Error while restarting Wifi' });
        }
        break;
    }
  };

  async toggleWifi(state: 'up' | 'down') {
    return new Promise<void>((resolve, error) => {
      this.logger.info(`Updating Wifi state ${state}...`);

      exec(`sudo ip link set wlan0 ${state}`, (err) => {
        if (err) {
          error(err);
        } else {
          resolve();
          this.logger.info('Wifi stated updated');
        }
      });
    });
  }

  async restart() {
    return new Promise<void>((resolve, error) => {
      this.logger.info('Running reboot command');

      exec(`sudo reboot -f`, (err) => {
        if (err) {
          error(err);
        } else {
          resolve();
          this.logger.info('rebooting...');
        }
      });
    });
  }

  async halt() {
    return new Promise<void>((resolve, error) => {
      this.logger.info('Running halt command');

      exec(`sudo halt -f`, (err) => {
        if (err) {
          error(err);
        } else {
          resolve();
          this.logger.info('halting...');
        }
      });
    });
  }
}

export default MiscService;
