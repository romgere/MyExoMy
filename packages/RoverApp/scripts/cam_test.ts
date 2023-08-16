/*
  This script helps to test the functionality of the Raspberry Pi camera.
*/
import { StreamCamera, Codec } from 'pi-camera-connect';
import fs from 'fs-extra';
import path from 'path';
import prompt from 'prompt';

prompt.start();
prompt.message = '';

const defaultFolder = '/home/pi/Videos/';
const file = 'exomy-video-test.h264';

async function main() {
  console.log(`Where do you want the file to be written ? (default: ${defaultFolder})`);
  const res = await prompt.get(['folder']);

  const destFolder = (res.folder as string) ?? defaultFolder;

  const streamCamera = new StreamCamera({
    codec: Codec.H264,
    width: 1920,
    height: 1080,
  });

  const videoStream = streamCamera.createStream();
  const writeStream = fs.createWriteStream(path.join(destFolder, file));

  videoStream.pipe(writeStream);

  await streamCamera.startCapture();

  await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));

  await streamCamera.stopCapture();

  console.log('Video recorded !');
  console.log(`Check into "${destFolder}" folder for a "${file}" file`);
}

await main();
