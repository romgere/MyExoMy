import Service from './-base.js';
import HttpServer from '@robot/rover-app/lib/http-server.js';
import { videoServerPort } from '../const.js';
import type { Request, Response } from 'express';
import camera, { Mirror, type CameraOptions } from 'pi-camera-native-ts';

const boundary = 'totalmjpeg';
const streamHeaders = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0',
  Pragma: 'no-cache',
  Connection: 'close',
  'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`,
};

const defaultCameraSettings: Omit<CameraOptions, 'encoding'> = {
  width: 1440,
  height: 1080,
  fps: 12,
  quality: 12,
  rotation: 0,
  mirror: Mirror.NONE,
};

class CameraService extends Service {
  static serviceName = 'camera';

  private currentConfig: CameraOptions;
  private httpServer = new HttpServer(videoServerPort);
  private clientResponses: Response[] = [];

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);

    this.currentConfig = {
      ...defaultCameraSettings,
      ...(this.config.camera ?? {}),
      encoding: 'MJPEG',
    };
  }

  async init() {
    camera.on('frame', this.broadcastFrameData);

    this.httpServer.expressApp.get('/', this.onGetStream.bind(this));
    this.on('updateCameraSettings', this.updateCameraSettings.bind(this));
  }

  async startCamera() {
    await camera.start(this.currentConfig);
  }

  async stopCamera() {
    camera.off('frame', this.broadcastFrameData);
    await camera.stop();
  }

  async updateCameraSettings(config: Omit<CameraOptions, 'encoding'>) {
    if (camera.running) {
      await this.stopCamera();
    }

    this.currentConfig = {
      ...defaultCameraSettings,
      ...(config ?? {}),
      encoding: 'MJPEG',
    };

    if (this.clientResponses.length) {
      await this.startCamera();
    }
  }

  async onGetStream(req: Request, res: Response) {
    if (!camera.running) {
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
