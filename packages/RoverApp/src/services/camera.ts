import Service from './-base.js';
import { StreamCamera, Codec } from 'pi-camera-connect';

import type { Request, Response } from 'express';
import type EventBroker from '@robot/rover-app/lib/event-broker.js';
import type { ExomyConfig, CameraConfig } from '@robot/rover-app/types.js';
import type HttpServer from '@robot/rover-app/lib/http-server.js';

const boundary = 'totalmjpeg';
const streamHeaders = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0',
  Pragma: 'no-cache',
  Connection: 'close',
  'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`,
};

const defaultCameraSettings = {
  width: 1296,
  height: 972,
  fps: 10,
};

class CameraService extends Service {
  static serviceName = 'camera';

  camera: StreamCamera;

  cameraStarted = false;
  clientResponses: Response[] = [];

  constructor(config: ExomyConfig, eventBroker: EventBroker, httpsServer: HttpServer) {
    super(config, eventBroker, httpsServer);

    this.camera = new StreamCamera({
      ...defaultCameraSettings,
      ...(config.camera ?? {}),
      codec: Codec.MJPEG, // Force codec to MJPEG
    });

    this.httpServer.expressApp.get('/videostream.mjpg', this.onGetStream.bind(this));

    this.eventBroker.on('updateCameraSettings', this.updateCameraSettings.bind(this));
  }

  async init() {}

  async startCamera() {
    await this.camera.startCapture();
    this.camera.on('frame', this.broadcastFrameData.bind(this));
    this.cameraStarted = true;
  }

  async updateCameraSettings(config: CameraConfig) {
    if (this.cameraStarted) {
      await this.stopCamera();
    }

    this.camera = new StreamCamera({
      ...defaultCameraSettings,
      ...(config ?? {}),
      codec: Codec.MJPEG, // Force codec to MJPEG
    });

    if (this.clientResponses.length) {
      await this.startCamera();
    }
  }

  async stopCamera() {
    this.camera.off('frame', this.broadcastFrameData.bind(this));
    await this.camera.stopCapture();
    this.cameraStarted = false;
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

  broadcastFrameData(frame: Buffer) {
    for (const res of this.clientResponses) {
      res.write(`--${boundary}\nContent-Type: image/jpg\nContent-length: ${frame.length}\n\n`);
      res.write(frame);
    }
  }
}

export default CameraService;
