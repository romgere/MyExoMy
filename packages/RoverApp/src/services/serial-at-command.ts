import { spawn } from 'child_process';
import { safe_sms_mode, sim7600e_serial_at_device, sms_verify_interval } from '../const.js';
import Service from './-base.js';
import promiseWithResolvers, {
  type PromiseWithResolvers,
} from '../helpers/promise-with-resolver.js';
import logger from '../lib/logger.ts';
import { SendSMSEvent } from '@robot/shared/events.js';

const RESPONSE_TIMEOUT = Symbol('minicom-response-timeout');

type ResponseTimeout = typeof RESPONSE_TIMEOUT;

type CommandOptions = {
  expectedResponseEnd: string;
  timeout: number;
  stripResponseEnd: boolean;
};

type SMS = {
  id: string;
  sender: string;
  status: string;
  date: string;
  content: string;
};

const defaultCommandOptions: CommandOptions = {
  expectedResponseEnd: 'OK',
  timeout: 1000, // Totally arbitrary, seems fine
  stripResponseEnd: true,
};

function sanitizeStr(str: string) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '').trim();
}

export default class SerialATCommandService extends Service {
  static serviceName = 'AT command';

  private _minicomProcess = spawn('minicom', ['-D', sim7600e_serial_at_device]);

  private _responseBuffer = '';

  private _expectedResponse: string | undefined;
  private _waitedResponsePromise: PromiseWithResolvers<string> | undefined;

  private get smsRecipient() {
    return this.config.smsRecipient;
  }

  async init() {
    this._minicomProcess.stdout.on('data', this.onMinicomData.bind(this));

    // Handle errors cases (make service crash - should restart minicom)
    this._minicomProcess.on('error', this.onMinicomError.bind(this));
    this._minicomProcess.on('close', () => {
      this.onMinicomError(new Error('Received "close"'));
    });
    this._minicomProcess.on('disconnect', () => {
      this.onMinicomError(new Error('Received "disconnect"'));
    });
    this._minicomProcess.on('exit', () => {
      this.onMinicomError(new Error('Received "exit"'));
    });

    // Disabled echo & wait for answer before considering service fully initialized
    this.sendATCommand('ATE0');
    await this.waitForAnswer('OK', 1000);

    // Set Text Mode SMS
    await this.sendCommand('AT+CMGF=1');

    // Send ready SMS
    try {
      logger.info('Sending "ready" SMS');
      await this.sendSms(this.smsRecipient, 'ROVER IS READY');
      logger.info('SMS sent');
    } catch (e) {
      logger.error('Fail to send "ready" SMS', e);
    }

    // Read "pending" SMS (clear message memory)
    await this.readSms();

    // Start polling incoming SMS
    setInterval(this.checkSms.bind(this), sms_verify_interval);

    // Listen to other service that want to send SMS
    this.on('sendSms', this.onSentSms.bind(this));
  }

  async onSentSms(evt: SendSMSEvent) {
    // TODO: implement some queue mechanism here ?
    await this.sendSms(evt.recipient ?? this.smsRecipient, evt.content);
  }

  private _checkingSMS = false;

  async checkSms() {
    if (this._checkingSMS) {
      return;
    }

    this._checkingSMS = true;

    const messages = await this.readSms();

    if (messages.length) {
      logger.log('SMS received', messages);
    }

    for (const message of messages) {
      // "Built-in" ping mechanisme
      if (message.content.toUpperCase() === 'PING') {
        await this.sendSms(this.smsRecipient, 'PONG!');
      }
      // Dispatch SMS event to over service
      else {
        if (!safe_sms_mode || this.smsRecipient === message.sender) {
          this.emit('incomingSms', { sender: message.sender, content: message.content });
        }
      }
    }

    this._checkingSMS = false;
  }

  private async sendCommand(command: string, options?: Partial<CommandOptions>) {
    const opt: CommandOptions = {
      ...defaultCommandOptions,
      ...(options ?? {}),
    };

    // Reset reponse buffer in case there's remaining data from previous command
    this._responseBuffer = '';

    this.sendATCommand(command);

    let res = await this.waitForAnswer(opt.expectedResponseEnd, opt.timeout);
    if (opt.stripResponseEnd) {
      res = res.trim().replace(opt.expectedResponseEnd, '').trim();
    }

    return res;
  }

  private sendATCommand(command: string) {
    this._minicomProcess.stdin.write(`${command}\r\n`);
  }

  private async waitForAnswer(expectedResponse: string = 'OK', timeout: number): Promise<string> {
    if (this._expectedResponse || this._waitedResponsePromise) {
      throw new Error("Response already awaited, can't run multiple command in parallele");
    }

    if (!sanitizeStr(this._responseBuffer).includes(expectedResponse)) {
      this._expectedResponse = expectedResponse;
      this._waitedResponsePromise = promiseWithResolvers<string>();

      let res: ResponseTimeout | string | undefined = undefined;

      try {
        res = await Promise.race([
          this._waitedResponsePromise.promise,
          this.timeoutPromise(timeout),
        ]);
      } finally {
        this._expectedResponse = undefined;
        this._waitedResponsePromise = undefined;
      }

      if (res === RESPONSE_TIMEOUT) {
        throw new Error(
          `timeout waiting for minicom response "${expectedResponse}", received "${this._responseBuffer}"`,
        );
      } else if (res === undefined) {
        throw new Error(`Error while waiting for minicom response "${expectedResponse}"`);
      }

      return res;
    }

    const res = this._responseBuffer;
    this._responseBuffer = '';
    return res;
  }

  private timeoutPromise(timeout: number): Promise<ResponseTimeout> {
    return new Promise(function (resolve) {
      setTimeout(() => resolve(RESPONSE_TIMEOUT), timeout);
    });
  }

  private onMinicomData(data: string) {
    this._responseBuffer += data;

    if (
      this._expectedResponse &&
      sanitizeStr(this._responseBuffer).includes(this._expectedResponse)
    ) {
      const res = this._responseBuffer;
      this._responseBuffer = '';
      this._waitedResponsePromise?.resolve(res);
    }
  }

  private onMinicomError(error: Error) {
    try {
      this._minicomProcess.stdin.end();
      this._minicomProcess.kill();
    } catch (_e) {
      // eslint-disable-next-line no-empty
    }

    throw new Error(`Minicom process error: ${error.message}`);
  }

  private async sendSms(recipient: string, message: string) {
    await this.sendCommand(`AT+CMGS="${recipient}"`, {
      expectedResponseEnd: '>',
    });

    try {
      await this.sendCommand(`${message}\u001a`);
    } catch (e) {
      logger.error('Fail to send SMS', e);
    }
  }

  private async readSms(): Promise<SMS[]> {
    const messages: SMS[] = [];

    const response = await this.sendCommand('AT+CMGL="ALL"');
    if (response) {
      /**
       * Parse response, can contains multiple message :
       * +CMGL: 1,"REC UNREAD","+31628870634","","11/01/09,10:26:26+04"
       * This is text message 1
       * +CMGL: 2,"REC UNREAD","+31628870634","","11/01/09,10:26:49+04"
       * This is text message 2
       */
      const regex = /\+CMGL:( ?\d{1,2}),"([^"]*)","([^"]*)","([^"]*)","([^"]*)"([^+]*)/gm;
      let m;
      while ((m = regex.exec(response)) !== null) {
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        const [, id, status, sender, , date, content] = m;
        const message = {
          id: id.trim(),
          sender,
          status,
          date,
          content: sanitizeStr(content),
        };
        messages.push(message);

        // Remove SMS from SIM memory
        await this.sendCommand(`AT+CMGD=${message.id}`);
      }
    }

    return messages;
  }
}
