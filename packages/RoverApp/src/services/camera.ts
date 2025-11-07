import Service from './-base.js';
import HttpServer from '@robot/rover-app/lib/http-server.js';
import { camera_ir_cut_gpio_pin, videoServerPort } from '../const.js';
import type { Request, Response } from 'express';
import { type CameraConfig } from '@robot/shared/camera.js';
import StreamCamera from '../lib/stream-camera.ts';
import { exec } from 'child_process';

const boundary = 'totalmjpeg';
const streamHeaders = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0',
  Pragma: 'no-cache',
  Connection: 'close',
  'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`,
};

const defaultCameraSettings: CameraConfig = {
  width: 1440,
  height: 1080,
  fps: 12,
  quality: 75,
};

function execPromised(cmd: string) {
  return new Promise<void>(function (resolve, reject) {
    exec(cmd, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

class CameraService extends Service {
  static serviceName = 'camera';

  private camera: StreamCamera;
  private httpServer = new HttpServer(videoServerPort);
  private cameraStarted = false;
  private clientResponses: Response[] = [];

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);

    this.camera = new StreamCamera({
      ...defaultCameraSettings,
      ...(this.config.camera ?? {}),
    });
  }

  async init() {
    // Set GPIO to output
    try {
      this.logger.log('Setting IR cut GPIO port to output...');
      await execPromised(`pigs modes ${camera_ir_cut_gpio_pin} w`);
    } catch (e) {
      this.logger.error('Error setting GPIO', e);
    }

    this.httpServer.expressApp.get('/', this.onGetStream.bind(this));
    this.on('updateCameraSettings', this.updateCameraSettings.bind(this));
    this.on('toggleCameraIR', this.toggleCameraIR.bind(this));
  }

  async startCamera() {
    await this.camera.startCapture();
    this.camera.on('frame', this.broadcastFrameData);
    this.cameraStarted = true;
  }

  async stopCamera() {
    this.camera.off('frame', this.broadcastFrameData);
    await this.camera.stopCapture();
    this.cameraStarted = false;
  }

  async toggleCameraIR(enable: boolean) {
    this.logger.log('Toggling IR camera, enabled: ', enable);
    await execPromised(`pigs w 5 ${enable ? '1' : '0'}`);
  }

  async updateCameraSettings(config: CameraConfig) {
    if (this.cameraStarted) {
      await this.stopCamera();
    }

    this.camera = new StreamCamera({
      ...defaultCameraSettings,
      ...(config ?? {}),
    });

    if (this.clientResponses.length) {
      await this.startCamera();
    }
  }

  async onGetStream(req: Request, res: Response) {
    if (!this.cameraStarted) {
      await this.startCamera();
    }

    res.writeHead(200, streamHeaders);
    this.clientResponses.push(res);

    req.on('close', async () => {
      const i = this.clientResponses.indexOf(res);
      this.clientResponses.splice(i, 1);

      if (!this.clientResponses.length) {
        await this.stopCamera();
      }
    });
  }

  private broadcastFrameData = (frame: Buffer) => {
    const frameSeparator = `--${boundary}\nContent-Type: image/jpg\nContent-length: ${frame.length}\n\n`;
    for (const res of this.clientResponses) {
      res.write(frameSeparator);
      res.write(frame);
    }
  };
}

export default CameraService;
