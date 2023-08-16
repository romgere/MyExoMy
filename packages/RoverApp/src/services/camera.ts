import Service from './-base.js';
import * as stream from 'stream';
import { StreamCamera, Codec } from 'pi-camera-connect';

import type { Request, Response } from 'express';

const boundary = 'totalmjpeg';
const streamHeaders = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0',
  Pragma: 'no-cache',
  Connection: 'close',
  'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`,
};

class CameraService extends Service {
  static serviceName = 'camera';

  camera: StreamCamera;
  // stream: stream.Readable;

  cameraStarted = false;
  clientResponses: Response[] = [];

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);
    this.camera = new StreamCamera({
      codec: Codec.MJPEG,
      width: 1296,
      height: 972,
      fps: 10,
    });

    this.express.get('/videostream.mjpg', this.onGetStream.bind(this));
    // this.stream = this.camera.createStream();
  }

  async init() {}

  async onGetStream(req: Request, res: Response) {
    if (!this.cameraStarted) {
      await this.camera.startCapture();
      this.camera.on('frame', this.broadcastFrameData.bind(this));
      this.cameraStarted = true;
    }

    res.writeHead(200, streamHeaders);
    this.clientResponses.push(res);

    req.on('close', async () => {
      const i = this.clientResponses.indexOf(res);
      this.clientResponses.splice(i, 1);

      if (!this.clientResponses.length) {
        this.camera.off('frame', this.broadcastFrameData.bind(this));
        await this.camera.stopCapture();
        this.cameraStarted = false;
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
