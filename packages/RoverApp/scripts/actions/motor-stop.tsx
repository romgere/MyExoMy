import React, { useState, useEffect } from 'react';
import { Box, Newline, Text } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';

import { Task } from 'ink-task-list';
import spinners from 'cli-spinners';

import asyncPca9685 from '@robot/rover-app/helpers/async-pca-9685.js';
import wait from 'scripts/utils/wait.ts';

// Stops all the motors, in case they were left in a running state.
export const MotorStop = ({ onFinish }: PageArg) => {
  const [motorStop, setMotorStop] = useState(false);
  const [motor, setMotor] = useState(0);

  const stopMotors = async function () {
    const pwm = await asyncPca9685();

    for (let pin = 0; pin < 16; pin++) {
      pwm.setPulseRange(pin, 0, 0);
      await wait(50);
      setMotor(pin);
    }
  };

  useInput(() => {
    onFinish();
  });

  useEffect(() => {
    stopMotors().then(() => {
      setMotorStop(true);
    });
  }, []);

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {motorStop ? (
        <Task label="All motor has been stopped" state="success" />
      ) : (
        <Task
          label={`Stopping motor on PIN ${motor + 1}`}
          state="loading"
          spinner={spinners.dots}
        />
      )}
      <Newline />
      <Text>Press any key to quit</Text>
    </Box>
  );
};
