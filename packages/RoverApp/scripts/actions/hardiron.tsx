import React, { useState, useEffect, useRef } from 'react';
import { Box, Newline, Text } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';
import spinners from 'cli-spinners';
import { Br } from 'scripts/utils/br.tsx';
import { Task } from 'ink-task-list';

import MagnetometerSensor from '@robot/rover-app/lib/sensors/magnetometer.js';
import { Confirm } from 'scripts/utils/confirm.tsx';
import { ExomyConfig } from '@robot/rover-app/types.js';
import readConfig from '@robot/rover-app/helpers/read-config.ts';
import writeConfig from '@robot/rover-app/helpers/write-config.ts';

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

type HardironStep = 'info' | 'calibration' | 'confirm';
export const HardironCalibration = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<HardironStep>('info');

  const [hardiron_x, set_hardiron_x] = useState(0);
  const [hardiron_y, set_hardiron_y] = useState(0);
  const [hardiron_z, set_hardiron_z] = useState(0);

  const config = useRef<ExomyConfig>(undefined);

  useEffect(() => {
    config.current = readConfig();
  }, []);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      clearInterval(computeInterval);
      clearInterval(readInterval);
      onFinish();
    }

    if (currentStep === 'info') {
      setStep('calibration');
    } else if (currentStep === 'calibration') {
      clearInterval(computeInterval);
      clearInterval(readInterval);
      setStep('confirm');
    }
  });

  const onCancelConfig = () => {
    onFinish();
  };

  const onConfirmConfig = () => {
    if (!config.current) {
      return;
    }

    config.current.hardironX = hardiron_x;
    config.current.hardironY = hardiron_y;
    config.current.hardironZ = hardiron_z;

    writeConfig(config.current);
    onFinish();
  };

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
          <Text>Rotate the rover through all possible orientations...</Text>
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
          <Text>When values are stabilized, press any key to continu.</Text>
        </Box>
      ) : currentStep === 'info' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>This script will help you calibrating magnetometer</Text>
          <Br />
          <Newline />
          <Text>During the process, rotate the rover through all possible orientations.</Text>
          <Text>Press any key to start.</Text>
        </Box>
      ) : (
        <Confirm
          onCancel={onCancelConfig}
          onConfirm={onConfirmConfig}
          title="Save configuration"
          message="Do you want to save new settings to rover configuation file ?"
        >
          <Text>
            hardiron_x : <Text color={'blue'}>{hardiron_x}</Text>
          </Text>
          <Text>
            hardiron_y : <Text color={'blue'}>{hardiron_y}</Text>
          </Text>
          <Text>
            hardiron_z : <Text color={'blue'}>{hardiron_z}</Text>
          </Text>
        </Confirm>
      )}
    </Box>
  );
};
