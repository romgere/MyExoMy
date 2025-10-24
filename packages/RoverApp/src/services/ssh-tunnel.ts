// inspired from https://github.com/normen/rpi-throttled/blob/master/lib.js
import Service from './-base.js';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { httpServerPort, videoServerPort } from '@robot/rover-app/const.js';

import type { IncomingSMSEvent } from '@robot/shared/events.js';
import sleep from '../helpers/sleep.ts';

class SshTunnelService extends Service {
  static serviceName = 'ssh-tunnel';

  private tunnelStarted = false;

  private sshProcess?: ChildProcessWithoutNullStreams;

  private get sshProcessArgs() {
    return [
      `${this.config.gitHubUsername}@srv.us`,
      '-R',
      `1:localhost:${httpServerPort}`,
      '-R',
      `2:localhost:${videoServerPort}`,
    ];
  }

  async init() {
    if (this.config.sshTunnelAutoStart) {
      await this.startSshTunnel();
    }

    this.on('incomingSms', this._onSms);
  }

  private _onSms = (sms: IncomingSMSEvent) => {
    switch (sms.content.toLowerCase()) {
      case 'tunnel-start':
      case 'tunnel-on':
      case 'tunnelstart':
      case 'tunnelon':
      case 'ssh-start':
      case 'ssh-on':
      case 'sshstart':
      case 'sshon':
        this.startSshTunnel();
        break;

      case 'tunnel-stop':
      case 'tunnel-off':
      case 'tunnelstop':
      case 'tunneloff':
      case 'ssh-stop':
      case 'ssh-off':
      case 'sshstop':
      case 'sshoff':
        this.stopSshTunnel();
        break;
    }
  };

  async startSshTunnel() {
    if (this.tunnelStarted) {
      this.logger.warn("Can't start SSH tunnel, it's already started.");
      return;
    }

    const { sshProcessArgs } = this;
    this.logger.info('Starting SSH tunnel...', sshProcessArgs);

    this.sshProcess = spawn('ssh', sshProcessArgs);

    if (this.sshProcess.exitCode) {
      this.logger.warn("Can't start SSH tunnel, exitCode detected.", this.sshProcess.exitCode);
      this.sshProcess = undefined;
      return;
    }

    // Handle errors cases (make service crash)
    this.sshProcess.on('error', this.onProcessError.bind(this));
    this.sshProcess.on('close', () => {
      if (this.tunnelStarted) {
        this.onProcessError(new Error('SSH process "close"'));
      }
    });
    this.sshProcess.on('disconnect', () => {
      if (this.tunnelStarted) {
        this.onProcessError(new Error('SSH process "disconnect"'));
      }
    });
    this.sshProcess.on('exit', () => {
      if (this.tunnelStarted) {
        this.onProcessError(new Error('SSH process "exit"'));
      }
    });

    this.logger.info('SSH tunnel wait for ssh answer...');

    // Wait a bit for the process to start, before reading stdout for info...
    await sleep(2000);

    if (this.sshProcess.exitCode) {
      this.logger.warn("Can't start SSH tunnel, exitCode detected.", this.sshProcess.exitCode);
      this.sshProcess = undefined;
      return;
    }

    try {
      const [h1, h2] = this.parseStdOut(String(this.sshProcess.stdout.read()));

      await this.emit('sendSms', {
        content: `SSH tunnel started.\n Hostnames:\n  - ${h1}\n  - ${h2}`,
      });
    } catch (e) {
      await this.emit('sendSms', { content: `SSH tunnel started error : ${e}` });
    }

    this.tunnelStarted = true;

    this.logger.info('SSH tunnel started');
  }

  private parseStdOut(output: string) {
    const hostnames: [string, string] = ['???', '???'];

    const lines = output
      .split('\n')
      .map((l) => l.trim())
      .filter((m) => m.length);

    for (const line of lines) {
      if (['1', '2'].includes(line.charAt(0))) {
        // Parse host name
        const lineHostNames = line.replace('1: ', '').replace('2: ', '').split(',');
        hostnames[line.charAt(0) === '1' ? 0 : 1] =
          lineHostNames.length === 2 ? lineHostNames[1] : lineHostNames[0];
      } else {
        throw new Error(`Error parsing output: ${line}`);
      }
    }

    return hostnames;
  }

  private onProcessError(error: Error) {
    try {
      this.sshProcess?.kill();
    } catch (_e) {
      // eslint-disable-next-line no-empty
    }

    throw new Error(`SSH tunnel process error: ${error.message}`);
  }

  async stopSshTunnel() {
    if (!this.tunnelStarted) {
      this.logger.warn("Can't stop SSH tunnel, it's already stopped.");
      return;
    }

    this.logger.log('Stopping SSH tunnel...');

    // Turn this to flase before stopping to prevent error to be thrown
    this.tunnelStarted = false;

    this.sshProcess?.kill();
    this.sshProcess = undefined;

    await this.emit('sendSms', { content: 'SSH tunnel stopped' });

    this.logger.log('SSH tunnel stopped.');
  }
}

export default SshTunnelService;
