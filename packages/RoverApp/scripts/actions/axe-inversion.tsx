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
import { RoverOrientation } from '@robot/shared/types.js';

const magneto = new MagnetometerSensor();
await magneto.init();
await magneto.setContinuousMode(true);
await magneto.setDataRate(255);

const gyro = new GyroscopeSensor();
await gyro.init();

let readInterval: undefined | NodeJS.Timeout;
let initialOrientation: RoverOrientation;

type AxeInversionStep =
  | 'info'
  | 'pitch'
  | 'roll'
  | 'heading'
  | 'confirm_pitch'
  | 'confirm_roll'
  | 'confirm_heading'
  | 'confirm';
export const AxeInversion = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<AxeInversionStep>('info');

  const inversePitch = useRef<boolean>(false);
  const inverseRoll = useRef<boolean>(false);
  const inverseHeading = useRef<boolean>(false);

  const config = useRef<ExomyConfig>(undefined);
  const orientationHelper = useRef<OrientationHelper>(undefined);

  useEffect(() => {
    config.current = readConfig();
    orientationHelper.current = new OrientationHelper({
      ...config.current,
      // Ensure we're not using any inverse or deviation in computation
      inverseHeading: false,
      inversePitch: false,
      inverseRoll: false,
      deviationPitch: 0,
      deviationRoll: 0,
      deviationHeading: 0,
    });
  }, []);

  async function startDetection(axe: 'pitch' | 'roll' | 'heading') {
    if (!orientationHelper.current) {
      return;
    }

    const magne = await magneto.getEvent();
    const accel = await gyro.getAccelerometerValues();

    initialOrientation = orientationHelper.current.calculate(accel, magne);

    readInterval = setInterval(async function () {
      if (!orientationHelper.current) {
        return;
      }

      const magne = await magneto.getEvent();
      const accel = await gyro.getAccelerometerValues();

      const orientation = orientationHelper.current.calculate(accel, magne);

      const diff = orientation[axe] - initialOrientation[axe];

      if (diff > 15 || diff < -15) {
        clearInterval(readInterval);

        const inverse = diff < 0;
        switch (axe) {
          case 'pitch':
            inversePitch.current = inverse;
            setStep('confirm_pitch');
            break;
          case 'roll':
            inverseRoll.current = inverse;
            setStep('confirm_roll');
            break;
          case 'heading':
            inverseHeading.current = inverse;
            setStep('confirm_heading');
            break;
        }
      }
    }, 50);
  }

  if (currentStep === 'pitch' || currentStep === 'roll' || currentStep === 'heading') {
    startDetection(currentStep);
  }

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      clearInterval(readInterval);
      onFinish();
    }

    if (currentStep === 'info') {
      setStep('pitch');
    }
  });

  const onCancelNext = () => {
    setStep(currentStep === 'confirm_heading' ? 'roll' : 'pitch');
  };

  const onConfirmNext = () => {
    if (currentStep === 'confirm_heading') {
      setStep('confirm');
    } else {
      setStep(currentStep === 'confirm_pitch' ? 'roll' : 'heading');
    }
  };

  const onCancelConfig = () => {
    onFinish();
  };

  const onConfirmConfig = () => {
    if (!config.current) {
      return;
    }

    config.current.inversePitch = inversePitch.current;
    config.current.inverseRoll = inverseRoll.current;
    config.current.inverseHeading = inverseHeading.current;

    writeConfig(config.current);
    onFinish();
  };

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'info' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>
            This script will help you determine if any orientation axes need to be inversed.
          </Text>
          <Br />
          <Newline />
          <Text>
            Please ensure your run <Text color={'yellow'}>HardIron calibration</Text> before running
            this one.
          </Text>
          <Newline />
          <Text>Put the rover on the floor & press any key to start.</Text>
        </Box>
      ) : currentStep === 'confirm_pitch' ||
        currentStep === 'confirm_roll' ||
        currentStep === 'confirm_heading' ? (
        <Confirm
          onCancel={onCancelNext}
          onConfirm={onConfirmNext}
          title="Move detected"
          message="Movement has been detected, please put back the rover in initial position."
        >
          <Br />
          <Text>Press "Yes" to continu, or "No" to try again.</Text>
        </Confirm>
      ) : currentStep === 'confirm' ? (
        <Confirm
          onCancel={onCancelConfig}
          onConfirm={onConfirmConfig}
          title="Script done"
          message="Do you want to save new settings to rover configuration file ?"
        >
          <br />
          <Text>
            Inverse Pitch : <Text color={'blue'}>{inversePitch.current ? 'Yes' : 'No'}</Text>
          </Text>
          <Text>
            Inverse Roll : <Text color={'blue'}>{inverseRoll.current ? 'Yes' : 'No'}</Text>
          </Text>
          <Text>
            Inverse Heading : <Text color={'blue'}>{inverseHeading.current ? 'Yes' : 'No'}</Text>
          </Text>
        </Confirm>
      ) : (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Please move the rover slowly : </Text>
          <Br />
          <Task label="Waiting for rover rotation..." state="loading" spinner={spinners.dots} />
          <Br />
          {currentStep === 'pitch' ? (
            <Text>Face the rover head & raise front wheels until movement is detected</Text>
          ) : currentStep === 'roll' ? (
            <Text>Face the rover right side & raise the right side until movement is detected</Text>
          ) : (
            <Text>
              Keep the rover plane & rotate the rover clockwise until movement is detected
            </Text>
          )}
          <Br />
          <Text>
            Press <Text inverse={true}>Q</Text>/<Text inverse={true}>ESC</Text> to cancel.
          </Text>
        </Box>
      )}
    </Box>
  );
};
