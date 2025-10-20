import React, { useEffect, useState } from 'react';
import { Box, Newline, Text } from 'ink';
import { useInput } from 'ink';
import { Br } from 'scripts/utils/br.tsx';
import { Confirm } from 'scripts/utils/confirm.tsx';
import { Task } from 'ink-task-list';
import spinners from 'cli-spinners';
import { wheelPositionLabels, wiggleMotor } from 'scripts/utils/motor.ts';
import { MotorConfig } from './misc.ts';
import type { Pca9685Driver } from 'pca9685';

type MotorConfigTestStep = 'info' | 'move' | 'confirm';
type MotorConfigTestArgs = {
  driver: Pca9685Driver;
  config: MotorConfig[];
  onConfirm: () => void;
  onError: () => void;
};

const MotorConfigTest = ({ driver, config, onConfirm, onError }: MotorConfigTestArgs) => {
  const [currentIndex, setIndex] = useState(0);
  const [currentStep, setStep] = useState<MotorConfigTestStep>('info');

  useInput(() => {
    if (currentStep === 'info') {
      setStep('move');
    }
  });

  useEffect(() => {
    if (currentStep === 'move') {
      wiggleMotor(driver, config[currentIndex].pin).then(() => {
        setStep('confirm');
      });
    }
  }, [currentStep, currentIndex]);

  const goNext = () => {
    if (currentIndex === 11) {
      onConfirm();
    } else {
      setIndex(currentIndex + 1);
      setStep('move');
    }
  };

  const { pin, type, position } = config[currentIndex];
  const motorLabel = `${wheelPositionLabels[position]} ${type} motor (PIN ${pin + 1})`;

  if (currentStep === 'move') {
    return (
      <Box alignItems="center" width="100%" flexDirection="column">
        <Task label={`Moving ${motorLabel}`} state="loading" spinner={spinners.dots} />
        <Br />
        <Text>Please ensure this is correct...</Text>
      </Box>
    );
  } else if (currentStep === 'confirm') {
    return (
      <Box alignItems="center" width="100%" flexDirection="column">
        <Confirm
          title="Please confirm motor settings"
          message={`Did I just moved ${motorLabel}`}
          onCancel={onError}
          onConfirm={goNext}
        />
      </Box>
    );
  } else if (currentStep === 'info') {
    return (
      <Box alignItems="center" width="100%" flexDirection="column">
        <Text>Configuration step finished, configuration seem OK.</Text>
        <Br />
        <Text>We are now going to check your configuration.</Text>
        <Text>
          I will move each motor one by one & you will get a chance to confirm the correct motor
          moved.
        </Text>
        <Newline />
        <Text>Press any key to continu</Text>
      </Box>
    );
  }
};

export default MotorConfigTest;
