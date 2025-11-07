import Service from './-base.js';
import HttpServer from '@robot/rover-app/lib/http-server.js';
import { videoServerPort } from '../const.js';
import type { Request, Response } from 'express';
import { type CameraConfig } from '@robot/shared/camera.js';
import StreamCamera from '../lib/stream-camera.ts';

const boundary = 'totalmjpeg';
const streamHeaders = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0',
  Pragma: 'no-cache',
  Connection: 'close',
  'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`,
};

const defaultCameraSettings = {
  width: 1440,
  height: 1080,
  fps: 12,
  bitRate: 8000000, // 1MB/s seems a good comprimise to save some bandwidth & keep correct quality
};

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
    this.httpServer.expressApp.get('/', this.onGetStream.bind(this));
    this.on('updateCameraSettings', this.updateCameraSettings.bind(this));
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
