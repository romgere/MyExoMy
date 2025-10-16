// import { sim7600e_serial_at_device } from '../const.js';
import Service from './-base.js';
// import { SerialPort } from 'serialport';

// 2015/10/16: 'serialport' lib does not support thread worker.
export default class SerialATCommandService extends Service {
  static serviceName = 'AT command';

  // port = new SerialPort({
  //   path: sim7600e_serial_at_device,
  //   baudRate: 115200,
  //   autoOpen: false,
  // });

  // private _open() {
  //   return new Promise<void>((resolve, reject) => {
  //     this.port.open(function (err: Error) {
  //       if (err) {
  //         reject(new Error('Error opening port: ', err));
  //       }
  //     });

  //     this.port.on('open', resolve);
  //   });
  // }

  async init() {
    // await this._open();
    // this.port.on('data', function (data: Buffer) {
    //   const reponseString = data.toString('utf8');
    //   console.log(`RECIVED: ${reponseString}`);
    // });
    // // Disable AT echo
    // await this.sendCommand('ATE0');
  }

  // async sendCommand(command: string) {
  //   return new Promise<string>((resolve, reject) => {
  //     const cmd = `${command}\r\n`;
  //     this.port.once('data', function (data: Buffer) {
  //       const reponseString = data.toString('utf8');
  //       resolve(reponseString);
  //     });
  //     this.port.write(cmd, async (err: Error) => {
  //       if (err) {
  //         reject(new Error('Error while writing command: ', err));
  //       }
  //     });
  //   });
  // }
}
