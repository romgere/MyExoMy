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

type AxeInversionStep = 'info' | 'move' | 'confirm_next' | 'confirm';
export const AxeInversion = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<AxeInversionStep>('info');

  const [axe, set_axe] = useState<'pitch' | 'roll' | 'heading'>('pitch');

  const [inversePitch, set_inversePitch] = useState(false);
  const [inverseRoll, set_inverseRoll] = useState(false);
  const [inverseHeading, set_inverseHeading] = useState(false);

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

  async function startDetection() {
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
            set_inversePitch(inverse);
            setStep('confirm_next');
            break;
          case 'roll':
            set_inverseRoll(inverse);
            setStep('confirm_next');
            break;
          case 'heading':
            set_inverseHeading(inverse);
            setStep('confirm_next');
            break;
        }
      }
    }, 50);
  }

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      clearInterval(readInterval);
      onFinish();
    }

    if (currentStep === 'info') {
      startDetection().then(() => {
        set_axe('pitch');
        setStep('move');
      });
    }
  });

  const onCancelNext = () => {
    startDetection().then(() => {
      setStep('move');
    });
  };

  const onConfirmNext = () => {
    if (axe === 'heading') {
      setStep('confirm');
    } else {
      set_axe(axe === 'pitch' ? 'roll' : 'heading');
      startDetection().then(() => {
        setStep('move');
      });
    }
  };

  const onCancelConfig = () => {
    onFinish();
  };

  const onConfirmConfig = () => {
    if (!config.current) {
      return;
    }

    config.current.inversePitch = inversePitch;
    config.current.inverseRoll = inverseRoll;
    config.current.inverseHeading = inverseHeading;

    writeConfig(config.current);
    onFinish();
  };

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'move' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Please move the rover slowly : </Text>
          <Br />
          <Task label="Waiting for rover rotation..." state="loading" spinner={spinners.dots} />
          <br />
          {axe === 'pitch' ? (
            <Text>Face the rover head & raise front wheels until movement is detected</Text>
          ) : axe === 'roll' ? (
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
      ) : currentStep === 'info' ? (
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
      ) : currentStep === 'confirm_next' ? (
        <Confirm
          onCancel={onCancelNext}
          onConfirm={onConfirmNext}
          title="Move detected"
          message="Movement has been detected, please put back the rover in initial position."
        >
          <Text>Press "Yes" to continu, or "No" to try again.</Text>
        </Confirm>
      ) : (
        <Confirm
          onCancel={onCancelConfig}
          onConfirm={onConfirmConfig}
          title="Script done"
          message="Do you want to save new settings to rover configuration file ?"
        >
          <Text>
            Inverse Pitch : <Text color={'blue'}>{inversePitch ? 'Yes' : 'No'}</Text>
          </Text>
          <Text>
            Inverse Roll : <Text color={'blue'}>{inverseRoll ? 'Yes' : 'No'}</Text>
          </Text>
          <Text>
            Inverse Heading : <Text color={'blue'}>{inverseHeading ? 'Yes' : 'No'}</Text>
          </Text>
        </Confirm>
      )}
    </Box>
  );
};
