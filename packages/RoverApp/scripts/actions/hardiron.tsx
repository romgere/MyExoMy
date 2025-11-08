import React, { useState, useEffect } from 'react';
import { Box, Newline, Text } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';
import spinners from 'cli-spinners';
import { Br } from 'scripts/utils/br.tsx';
import { Task } from 'ink-task-list';

import MagnetometerSensor from '@robot/rover-app/lib/sensors/magnetometer.js';

const magneto = new MagnetometerSensor();
await magneto.setContinuousMode(true);
await magneto.setDataRate(255);

let MagMinX = 0,
  MagMaxX = 0;
let MagMinY = 0,
  MagMaxY = 0;
let MagMinZ = 0,
  MagMaxZ = 0;

let computeInterval: undefined | NodeJS.Timeout;
let readInterval: undefined | NodeJS.Timeout;

type HardironStep = 'info' | 'calibration';
export const HardironCalibration = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<HardironStep>('info');

  const [hardiron_x, set_hardiron_x] = useState(0);
  const [hardiron_y, set_hardiron_y] = useState(0);
  const [hardiron_z, set_hardiron_z] = useState(0);

  useInput(() => {
    if (currentStep === 'info') {
      setStep('calibration');
    } else {
      clearInterval(computeInterval);
      clearInterval(readInterval);
      onFinish();
    }
  });

  useEffect(() => {
    if (currentStep === 'calibration') {
      computeInterval = setInterval(function () {
        set_hardiron_x(parseFloat(((MagMaxX + MagMinX) / 2).toFixed(5)));
        set_hardiron_y(parseFloat(((MagMaxY + MagMinY) / 2).toFixed(5)));
        set_hardiron_z(parseFloat(((MagMaxZ + MagMinZ) / 2).toFixed(5)));
      }, 1000);

      readInterval = setInterval(async function () {
        const magnetoData = await magneto.getEvent();

        MagMinX = Math.min(MagMinX, magnetoData.x);
        MagMinY = Math.min(MagMinY, magnetoData.y);
        MagMinZ = Math.min(MagMinZ, magnetoData.z);

        MagMaxX = Math.max(MagMaxX, magnetoData.x);
        MagMaxY = Math.max(MagMaxY, magnetoData.y);
        MagMaxZ = Math.max(MagMaxZ, magnetoData.z);
      }, 50);
    }
  }, [currentStep]);

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'calibration' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Move the rover while value are changing...</Text>
          <Br />
          <Task label="Computing hard iron values..." state="loading" spinner={spinners.dots} />
          <Newline />
          <Text>
            hardiron_x : <Text color={'blue'}>{hardiron_x}</Text>
          </Text>
          <Text>
            hardiron_y : <Text color={'blue'}>{hardiron_y}</Text>
          </Text>
          <Text>
            hardiron_z : <Text color={'blue'}>{hardiron_z}</Text>
          </Text>
          <Newline />
          <Text>Press any key to quit.</Text>
        </Box>
      ) : (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>This script will help you calibrating magnetometer</Text>
          <Br />
          <Newline />
          <Text>During the process, rotate the rover through all possible orientations.</Text>
        </Box>
      )}
    </Box>
  );
};
