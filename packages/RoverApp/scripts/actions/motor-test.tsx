import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';
import asyncPca9685 from '@robot/rover-app/helpers/async-pca-9685.js';
import {
  motorTypeSelectItems,
  MotorType,
  motorPositionSelectItems,
  wheelPositionLabels,
  testMotor,
} from 'scripts/utils/motor.ts';
import { WheelPosition } from '@robot/rover-app/const.ts';
import SelectInput from 'ink-select-input';
import { Task } from 'ink-task-list';
import spinners from 'cli-spinners';
import { Br } from 'scripts/utils/br.tsx';
import readConfig from '@robot/rover-app/helpers/read-config.ts';
import { ExomyConfig } from '@robot/rover-app/types.js';
import type { Pca9685Driver } from 'pca9685';

const motor_type_items: { value: MotorType | 'quit'; label: string }[] = [
  ...motorTypeSelectItems,
  {
    value: 'quit',
    label: 'Quit motor test',
  },
];

const motor_position_items: { value: WheelPosition | 'back'; label: string }[] = [
  ...motorPositionSelectItems,
  { value: 'back', label: 'Go back' },
];

type MotorTestStep = 'choose_motor_type' | 'choose_wheel_position' | 'moving';
export const MotorTest = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<MotorTestStep>('choose_motor_type');
  const [motorType, setMotorType] = useState<MotorType>();
  const [wheelPosition, setWheelPosition] = useState<WheelPosition>();
  const [pca9685, setPca9685] = useState<Pca9685Driver | undefined>();

  const config = useRef<ExomyConfig>(undefined);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onFinish();
    }
  });

  const handleMotorTypeSelect = ({ value }: { value: MotorType | 'quit' }) => {
    if (value === 'quit') {
      onFinish();
    } else {
      setMotorType(value);
      setStep('choose_wheel_position');
    }
  };

  const handleWheelPositionSelect = ({ value }: { value: WheelPosition | 'back' }) => {
    if (value === 'back') {
      setStep('choose_motor_type');
    } else {
      setWheelPosition(value);
      setStep('moving');
    }
  };

  useEffect(() => {
    config.current = readConfig();
    asyncPca9685().then(setPca9685);
  }, []);

  useEffect(() => {
    if (currentStep === 'moving') {
      testMotor(motorType!, wheelPosition!, config.current!, pca9685).then(() => {
        setStep('choose_motor_type');
      });
    }
  }, [wheelPosition, motorType, currentStep, pca9685]);

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'choose_motor_type' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Select the type of motor to test :</Text>
          <Br />
          <SelectInput items={motor_type_items} onSelect={handleMotorTypeSelect} />
        </Box>
      ) : currentStep === 'choose_wheel_position' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Select the position of motor to test :</Text>
          <Br />
          <SelectInput items={motor_position_items} onSelect={handleWheelPositionSelect} />
        </Box>
      ) : (
        <Task
          label={`Moving ${wheelPositionLabels[wheelPosition!]} ${motorType} motor`}
          state="loading"
          spinner={spinners.dots}
        />
      )}
    </Box>
  );
};
