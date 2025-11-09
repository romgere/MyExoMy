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
import GyroscopeSensor from '@robot/rover-app/lib/sensors/gyroscope.ts';
import OrientationHelper from '@robot/rover-app/lib/orientation.ts';

const magneto = new MagnetometerSensor();
await magneto.init();
await magneto.setContinuousMode(true);
await magneto.setDataRate(255);

const gyro = new GyroscopeSensor();
await gyro.init();

let minPitch = 9999;
let minRoll = 9999;
let minHeading = 9999;
let maxPitch = -9999;
let maxRoll = -9999;
let maxHeading = -9999;

let computeInterval: undefined | NodeJS.Timeout;
let readInterval: undefined | NodeJS.Timeout;

type OrientationDeviationStep = 'info' | 'calibration' | 'confirm';
export const OrientationDeviation = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<OrientationDeviationStep>('info');

  const deviationPitch = useRef(0);
  const deviationRoll = useRef(0);
  const deviationHeading = useRef(0);

  const config = useRef<ExomyConfig>(undefined);
  const orientationHelper = useRef<OrientationHelper>(undefined);

  useEffect(() => {
    config.current = readConfig();
    orientationHelper.current = new OrientationHelper({
      ...config.current,
      // Ensure we're not using any deviation in computation
      deviationPitch: 0,
      deviationRoll: 0,
      deviationHeading: 0,
    });
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

    config.current.deviationPitch = deviationPitch.current;
    config.current.deviationRoll = deviationRoll.current;
    config.current.deviationHeading = deviationHeading.current;

    writeConfig(config.current);
    onFinish();
  };

  useEffect(() => {
    if (currentStep === 'calibration') {
      minPitch = 9999;
      minRoll = 9999;
      minHeading = 9999;
      maxPitch = -9999;
      maxRoll = -9999;
      maxHeading = -9999;

      computeInterval = setTimeout(function () {
        let headDeviation = -parseFloat(((maxHeading + minHeading) / 2).toFixed(2));
        if (headDeviation < -180) {
          headDeviation = 360 + headDeviation;
        }

        deviationHeading.current = headDeviation;
        deviationPitch.current = -parseFloat(((maxPitch + minPitch) / 2).toFixed(2));
        deviationRoll.current = -parseFloat(((maxRoll + minRoll) / 2).toFixed(2));

        clearInterval(readInterval);
        setStep('confirm');
      }, 5000);

      readInterval = setInterval(async function () {
        if (!orientationHelper.current) {
          return;
        }

        const magne = await magneto.getEvent();
        const accel = await gyro.getAccelerometerValues();

        const orientation = orientationHelper.current.calculate(accel, magne);

        minHeading = Math.min(minHeading, orientation.heading);
        minPitch = Math.min(minPitch, orientation.pitch);
        minRoll = Math.min(minRoll, orientation.roll);

        maxHeading = Math.max(maxHeading, orientation.heading);
        maxPitch = Math.max(maxPitch, orientation.pitch);
        maxRoll = Math.max(maxRoll, orientation.roll);
      }, 50);
    }
  }, [currentStep]);

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'calibration' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Don't move the rover for the next 10 seconds.</Text>
          <Br />
          <Task
            label="Computing orientation deviation..."
            state="loading"
            spinner={spinners.dots}
          />
          <Newline />
          <Text>
            Please wait until end or press <Text inverse={true}>Q</Text>/
            <Text inverse={true}>ESC</Text> to cancel.
          </Text>
        </Box>
      ) : currentStep === 'info' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>This script will help you computing orientation deviation</Text>
          <Newline />
          <Text>
            Please ensure your run <Text color={'yellow'}>HardIron calibration</Text> &{' '}
            <Text color={'yellow'}>Axe inversion</Text> scripts before running this one.
          </Text>
          <Newline />
          <Text>Put the rover on place surface & ensure it faces the magnetic north.</Text>
          <Newline />
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
            Heading deviation : <Text color={'blue'}>{deviationHeading.current}</Text>
          </Text>
          <Text>
            Pitch deviation : <Text color={'blue'}>{deviationPitch.current}</Text>
          </Text>
          <Text>
            Roll deviation : <Text color={'blue'}>{deviationRoll.current}</Text>
          </Text>
        </Confirm>
      )}
    </Box>
  );
};
