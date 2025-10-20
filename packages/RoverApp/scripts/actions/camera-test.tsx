import React, { useState, useEffect } from 'react';
import { Box, Newline, Text } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';
import { Task } from 'ink-task-list';
import spinners from 'cli-spinners';
import { Br } from 'scripts/utils/br.tsx';
// import TextInput from 'ink-text-input';
import { StreamCamera, Codec } from 'pi-camera-connect';
import fs from 'fs-extra';
import path from 'path';
import wait from 'scripts/utils/wait.ts';

const defaultFolder = '/home/pi/Videos/';
const file = 'exomy-video-test.h264';

async function recordVideo(file: string) {
  const streamCamera = new StreamCamera({
    codec: Codec.H264,
    width: 1920,
    height: 1080,
  });

  const videoStream = streamCamera.createStream();
  const writeStream = fs.createWriteStream(file);

  videoStream.pipe(writeStream);
  await streamCamera.startCapture();
  await wait(5000);
  await streamCamera.stopCapture();
}

type CameraTestStep = 'choose_path' | 'capturing' | 'done' | 'error';
export const CameraTest = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<CameraTestStep>('choose_path');
  const [currentFolder, setFolder] = useState(defaultFolder);
  const [error, setError] = useState<string>();

  useInput((input, key) => {
    if (currentStep === 'done' || currentStep === 'error') {
      onFinish();
    }
    if ((input === 'q' && currentStep !== 'choose_path') || key.escape) {
      onFinish();
    }
  });

  useEffect(() => {
    if (currentStep === 'capturing') {
      const videoFile = path.join(currentFolder, file);

      recordVideo(videoFile)
        .then(() => {
          setStep('done');
        })
        .catch((e) => {
          setError(e?.message ?? 'Unknow error');
          setStep('error');
        });
    }
  }, [currentStep, currentFolder]);

  const onSubmitFolder = () => {
    if (fs.pathExistsSync(currentFolder)) {
      setStep('capturing');
    } else {
      setError('Path is not valid !');
    }
  };

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'choose_path' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Where do you want the file to be written :</Text>
          <Br />
          {/* <TextInput value={currentFolder} onChange={setFolder} onSubmit={onSubmitFolder} /> */}
          {error ? (
            <Text backgroundColor="red" color="white">
              {error}
            </Text>
          ) : undefined}
        </Box>
      ) : currentStep === 'done' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>5 seconds video file has been recorded to :</Text>
          <Br />
          <Text color="blue">{path.join(currentFolder, file)}</Text>
          <Newline />
          <Text>Press any key to quit</Text>
        </Box>
      ) : currentStep === 'capturing' ? (
        <Task label="Recording... please wait." state="loading" spinner={spinners.dots} />
      ) : (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>An error happened during video recording :</Text>
          <Br />
          <Text backgroundColor="red" color="white">
            {error}
          </Text>
          <Newline />
          <Text>Press any key to quit</Text>
        </Box>
      )}
    </Box>
  );
};
