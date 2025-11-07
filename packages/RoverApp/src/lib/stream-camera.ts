// Copy of https://raw.githubusercontent.com/launchcodedev/pi-camera-connect/refs/heads/master/src/lib/stream-camera.ts
// with update to make it compatible with raspbery new camera layer
// https://github.com/launchcodedev/pi-camera-connect/issues/39
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as stream from 'stream';
import { Flip, Rotation, CameraConfig, SensorMode } from '@robot/shared/camera.js';
import { Buffer } from 'node:buffer';
import logger from './logger.ts';

interface StreamCameraEventEmitter {
  on(event: 'frame', listener: (image: Buffer) => void): this;
  once(event: 'frame', listener: (image: Buffer) => void): this;
}

export type StreamCameraConfig = CameraConfig & {
  additionnalArgs?: string[];
  captureExecutableName: string;
};

export default class StreamCamera extends EventEmitter implements StreamCameraEventEmitter {
  private logger = logger('stream-camera-lib');

  private readonly options: StreamCameraConfig;
  private childProcess?: ChildProcessWithoutNullStreams;
  private streams: Array<stream.Readable> = [];

  static readonly jpegSignature = Buffer.from([0xff, 0xd8, 0xff]);

  constructor(options: Partial<StreamCameraConfig> = {}) {
    super();

    this.options = {
      rotation: Rotation.Rotate0,
      flip: Flip.None,
      quality: 50,
      fps: 30,
      sensorMode: SensorMode.AutoSelect,
      captureExecutableName: 'libcamera-vid',
      ...options,
    };
  }

  startCapture(): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      // TODO: refactor promise logic to be more ergonomic
      // so that we don't need to try/catch here
      try {
        const args: Array<string> = [
          // No output
          '-v',
          (0).toString(),

          // Width
          ...(this.options.width ? ['--width', this.options.width.toString()] : []),

          // Height
          ...(this.options.height ? ['--height', this.options.height.toString()] : []),

          // Rotation
          ...(this.options.rotation ? ['--rotation', this.options.rotation.toString()] : []),

          // Horizontal flip
          ...(this.options.flip &&
          (this.options.flip === Flip.Horizontal || this.options.flip === Flip.Both)
            ? ['--hflip']
            : []),

          // Vertical flip
          ...(this.options.flip &&
          (this.options.flip === Flip.Vertical || this.options.flip === Flip.Both)
            ? ['--vflip']
            : []),

          // Shutter Speed
          ...(this.options.shutter ? ['--shutter', this.options.shutter.toString()] : []),

          // Sharpness (-100 to 100; default 0)
          ...(this.options.sharpness ? ['--sharpness', this.options.sharpness.toString()] : []),

          // Contrast (-100 to 100; default 0)
          ...(this.options.contrast ? ['--contrast', this.options.contrast.toString()] : []),

          // Brightness (0 to 100; default 50)
          ...(this.options.brightness || this.options.brightness === 0
            ? ['--brightness', this.options.brightness.toString()]
            : []),

          // Saturation (-100 to 100; default 0)
          ...(this.options.saturation ? ['--saturation', this.options.saturation.toString()] : []),

          // EV Compensation
          ...(this.options.exposureCompensation
            ? ['--ev', this.options.exposureCompensation.toString()]
            : []),

          // Exposure Mode
          ...(this.options.exposureMode
            ? ['--exposure', this.options.exposureMode.toString()]
            : []),

          // Auto White Balance Mode
          ...(this.options.awbMode ? ['--awb', this.options.awbMode.toString()] : []),

          // Analog Gain
          ...(this.options.analogGain ? ['--analoggain', this.options.analogGain.toString()] : []),

          // Digital Gain
          ...(this.options.digitalGain
            ? ['--digitalgain', this.options.digitalGain.toString()]
            : []),

          // Bit rate
          ...(this.options.quality ? ['--quality', this.options.quality.toString()] : []),

          // Frame rate
          ...(this.options.fps ? ['--framerate', this.options.fps.toString()] : []),

          // Codec - force MJPEG as frame extraction (& quality option) only support this format
          '--codec',
          'MJPEG',

          /**
           * Sensor mode
           *
           * Camera version 1.x (OV5647):
           *
           * | Mode |        Size         | Aspect Ratio | Frame rates |   FOV   |    Binning    |
           * |------|---------------------|--------------|-------------|---------|---------------|
           * |    0 | automatic selection |              |             |         |               |
           * |    1 | 1920x1080           | 16:9         | 1-30fps     | Partial | None          |
           * |    2 | 2592x1944           | 4:3          | 1-15fps     | Full    | None          |
           * |    3 | 2592x1944           | 4:3          | 0.1666-1fps | Full    | None          |
           * |    4 | 1296x972            | 4:3          | 1-42fps     | Full    | 2x2           |
           * |    5 | 1296x730            | 16:9         | 1-49fps     | Full    | 2x2           |
           * |    6 | 640x480             | 4:3          | 42.1-60fps  | Full    | 2x2 plus skip |
           * |    7 | 640x480             | 4:3          | 60.1-90fps  | Full    | 2x2 plus skip |
           *
           *
           * Camera version 2.x (IMX219):
           *
           * | Mode |        Size         | Aspect Ratio | Frame rates |   FOV   | Binning |
           * |------|---------------------|--------------|-------------|---------|---------|
           * |    0 | automatic selection |              |             |         |         |
           * |    1 | 1920x1080           | 16:9         | 0.1-30fps   | Partial | None    |
           * |    2 | 3280x2464           | 4:3          | 0.1-15fps   | Full    | None    |
           * |    3 | 3280x2464           | 4:3          | 0.1-15fps   | Full    | None    |
           * |    4 | 1640x1232           | 4:3          | 0.1-40fps   | Full    | 2x2     |
           * |    5 | 1640x922            | 16:9         | 0.1-40fps   | Full    | 2x2     |
           * |    6 | 1280x720            | 16:9         | 40-90fps    | Partial | 2x2     |
           * |    7 | 640x480             | 4:3          | 40-90fps    | Partial | 2x2     |
           *
           */
          ...(this.options.sensorMode ? ['--mode', this.options.sensorMode.toString()] : []),

          // Capture time (ms) Zero = forever
          '--timeout',
          (0).toString(),

          // Do not display preview overlay on screen
          '--nopreview',

          // Add any "user" additionnal options
          ...(this.options.additionnalArgs ?? []),

          // Output to stdout
          '--output',

          '-',
        ];

        this.logger.log('start capturing...', this.options.captureExecutableName, args.join(' '));

        // Spawn child process
        this.childProcess = spawn(this.options.captureExecutableName, args);

        // Listen for error event to reject promise
        this.childProcess.once('error', () =>
          reject(
            new Error(
              "Could not start capture with StreamCamera. Are you running on a Raspberry Pi with 'raspivid' installed?",
            ),
          ),
        );

        // Wait for first data event to resolve promise
        this.childProcess.stdout.once('data', () => resolve());

        let stdoutBuffer = Buffer.alloc(0);

        // Listen for image data events and parse MJPEG frames if codec is MJPEG
        this.childProcess.stdout.on('data', (data: Buffer) => {
          this.streams.forEach((stream) => stream.push(data));

          stdoutBuffer = Buffer.concat([stdoutBuffer, data]);

          // Extract all image frames from the current buffer
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const signatureIndex = stdoutBuffer.indexOf(StreamCamera.jpegSignature, 0);

            if (signatureIndex === -1) break;

            // Make sure the signature starts at the beginning of the buffer
            if (signatureIndex > 0) stdoutBuffer = stdoutBuffer.slice(signatureIndex);

            const nextSignatureIndex = stdoutBuffer.indexOf(
              StreamCamera.jpegSignature,
              StreamCamera.jpegSignature.length,
            );

            if (nextSignatureIndex === -1) break;

            this.emit('frame', stdoutBuffer.slice(0, nextSignatureIndex));

            stdoutBuffer = stdoutBuffer.slice(nextSignatureIndex);
          }
        });

        // Listen for error events
        this.childProcess.stdout.on('error', (err) => this.emit('error', err));
        this.childProcess.stderr.on('data', (data) =>
          this.emit('error', new Error(data.toString())),
        );
        this.childProcess.stderr.on('error', (err) => this.emit('error', err));

        // Listen for close events
        this.childProcess.stdout.on('close', () => this.emit('close'));
      } catch (err) {
        return reject(err);
      }
    });
  }

  async stopCapture() {
    if (this.childProcess) {
      this.childProcess.kill();
    }

    // Push null to each stream to indicate EOF
    // tslint:disable-next-line no-null-keyword
    this.streams.forEach((stream) => stream.push(null));

    this.streams = [];
  }

  createStream() {
    const newStream = new stream.Readable({
      read: () => {},
    });

    this.streams.push(newStream);

    return newStream;
  }

  takeImage() {
    return new Promise<Buffer>((resolve) => this.once('frame', (data) => resolve(data)));
  }
}
