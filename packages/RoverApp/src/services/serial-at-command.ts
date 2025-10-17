import { spawn } from 'child_process';
import { sim7600e_serial_at_device } from '../const.js';
import Service from './-base.js';
import promiseWithResolvers, {
  type PromiseWithResolvers,
} from '../helpers/promise-with-resolver.js';

const RESPONSE_TIMEOUT = Symbol('minicom-response-timeout');
type ResponseTimeout = typeof RESPONSE_TIMEOUT;

type CommandOptions = {
  expectedResponseEnd: string;
  timeout: number;
  stripResponseEnd: boolean;
};

const defaultCommandOptions: CommandOptions = {
  expectedResponseEnd: 'OK',
  timeout: 50, // Totally arbitrary, seems fine
  stripResponseEnd: true,
};

export class SerialATCommandService extends Service {
  static serviceName = 'AT command';

  private _minicomProcess = spawn('minicom', ['-D', sim7600e_serial_at_device]);

  private _responseBuffer = '';

  private _expectedResponse: string | undefined;
  private _waitedResponsePromise: PromiseWithResolvers<string> | undefined;

  async init() {
    this._minicomProcess.stdout.on('data', this._onMinicomData);

    // Handle errors cases (make service crash - should restart minicom)
    this._minicomProcess.on('error', this._onMinicomError);
    this._minicomProcess.on('close', () => {
      this._onMinicomError(new Error('Received "close"'));
    });
    this._minicomProcess.on('disconnect', () => {
      this._onMinicomError(new Error('Received "disconnect"'));
    });
    this._minicomProcess.on('exit', () => {
      this._onMinicomError(new Error('Received "exit"'));
    });

    // Disabled echo & wait for answer before considering service fully initialized
    this._sendCommand('ATE0');
    await this._waitForAnswer('OK', 250);
  }

  async sendCommand(command: string, options?: Partial<CommandOptions>) {
    const opt: CommandOptions = {
      ...defaultCommandOptions,
      ...(options ?? {}),
    };

    // Reset reponse buffer in case there's remaining data from previous command
    this._responseBuffer = '';

    this._sendCommand(command);

    let res = await this._waitForAnswer(opt.expectedResponseEnd, opt.timeout);
    if (opt.stripResponseEnd) {
      res = res.trim().replace(opt.expectedResponseEnd, '').trim();
    }

    return res;
  }

  private _sendCommand(command: string) {
    this._minicomProcess.stdin.write(`${command}\r\n`);
  }

  private async _waitForAnswer(expectedResponse: string = 'OK', timeout: number): Promise<string> {
    if (this._expectedResponse || this._waitedResponsePromise) {
      throw new Error("Response already awaited, can't run multiple command in parallele");
    }

    if (!this._responseBuffer.trim().endsWith(expectedResponse)) {
      this._expectedResponse = expectedResponse;
      this._waitedResponsePromise = promiseWithResolvers<string>();

      let res: ResponseTimeout | string | undefined = undefined;

      try {
        res = await Promise.race([
          this._waitedResponsePromise.promise,
          this._timeoutPromise(timeout),
        ]);
      } finally {
        this._expectedResponse = undefined;
        this._waitedResponsePromise = undefined;
      }

      if (res === RESPONSE_TIMEOUT) {
        throw new Error(`timeout waiting for minicom response "${expectedResponse}"`);
      } else if (res === undefined) {
        throw new Error(`Error while waiting for minicom response "${expectedResponse}"`);
      }

      return res;
    }

    const res = this._responseBuffer;
    this._responseBuffer = '';
    return res;
  }

  private _timeoutPromise(timeout: number): Promise<ResponseTimeout> {
    return new Promise(function (resolve) {
      setTimeout(() => resolve(RESPONSE_TIMEOUT), timeout);
    });
  }

  private _onMinicomData = (data: string) => {
    this._responseBuffer += data;

    if (this._expectedResponse && this._responseBuffer.trim().endsWith(this._expectedResponse)) {
      const res = this._responseBuffer;
      this._responseBuffer = '';
      this._waitedResponsePromise?.resolve(res);
    }
  };

  private _onMinicomError = (error: Error) => {
    try {
      this._minicomProcess.stdin.end();
      this._minicomProcess.kill();
    } catch (_e) {
      // eslint-disable-next-line no-empty
    }

    throw new Error(`Minicom process error: ${error.message}`);
  };
}
