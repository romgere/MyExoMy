import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { Br } from 'scripts/utils/br.tsx';
import { Task } from 'ink-task-list';
import spinners from 'cli-spinners';
import { wheelPositionLabels, wiggleMotor } from 'scripts/utils/motor.ts';
import SelectInput from 'ink-select-input';
import { WheelPosition } from '@robot/rover-app/const.js';
import { MotorConfig, MotorType } from './misc.ts';
import type { Pca9685Driver } from 'pca9685';

type MotorPinLoopStep = 'move' | 'get_type' | 'get_position';
type MotorPinLoopArgs = {
  driver: Pca9685Driver;
  onFinish: (config: MotorConfig[]) => void;
};

const motor_type_items: { value: MotorType | 'none' | 'retry'; label: string }[] = [
  {
    value: 'driving',
    label: 'Driving motor - 360° servo',
  },
  {
    value: 'steering',
    label: 'Steering motor - 180° servo',
  },
  {
    value: 'retry',
    label: 'Move the motor again',
  },
  {
    value: 'none',
    label: 'None, no motor moved',
  },
];

const motor_position_items: { value: WheelPosition | 'back'; label: string }[] = [
  { value: WheelPosition.FL, label: wheelPositionLabels[WheelPosition.FL] },
  { value: WheelPosition.FR, label: wheelPositionLabels[WheelPosition.FR] },
  { value: WheelPosition.CL, label: wheelPositionLabels[WheelPosition.CL] },
  { value: WheelPosition.CR, label: wheelPositionLabels[WheelPosition.CR] },
  { value: WheelPosition.RL, label: wheelPositionLabels[WheelPosition.RL] },
  { value: WheelPosition.RR, label: wheelPositionLabels[WheelPosition.RR] },
  { value: 'back', label: 'Go back' },
];

const MotorPinLoop = ({ driver, onFinish }: MotorPinLoopArgs) => {
  const motorType = useRef<MotorType | undefined>(undefined);
  const motorPosition = useRef<WheelPosition | undefined>(undefined);
  const config = useRef<MotorConfig[]>([]);

  const [currentPin, setPin] = useState(0);
  const [currentStep, setStep] = useState<MotorPinLoopStep>('move');

  useEffect(() => {
    if (currentStep === 'move') {
      wiggleMotor(driver, currentPin).then(() => {
        setStep('get_type');
      });
    }
  }, [currentStep, currentPin]);

  const handleTypeSelect = ({ value }: { value: MotorType | 'none' | 'retry' }) => {
    if (value === 'retry') {
      setStep('move');
    } else if (value === 'none') {
      if (currentPin === 15) {
        onFinish(config.current);
      } else {
        motorType.current = undefined;
        motorPosition.current = undefined;
        setPin(currentPin + 1);
        setStep('move');
      }
    } else {
      motorType.current = value;
      setStep('get_position');
    }
  };

  const handlePositionSelect = ({ value }: { value: WheelPosition | 'back' }) => {
    if (value === 'back') {
      setStep('get_type');
    } else {
      motorPosition.current = value;

      // Add current PIN config to our config array
      config.current = [
        ...config.current,
        {
          pin: currentPin,
          type: motorType.current!,
          position: value,
        },
      ];

      if (currentPin === 15 || config.current.length === 12) {
        onFinish(config.current);
      } else {
        setPin(currentPin + 1);
        setStep('move');
      }
    }
  };

  if (currentStep === 'move') {
    return (
      <Box alignItems="center" width="100%" flexDirection="column">
        <Task
          label={`Moving motor on PIN ${currentPin + 1}`}
          state="loading"
          spinner={spinners.dots}
        />
        <Br />
        <Text>Look closely...</Text>
      </Box>
    );
  } else if (currentStep === 'get_type') {
    return (
      <Box alignItems="center" width="100%" flexDirection="column">
        <Text>Select the type of motor I just moved :</Text>
        <Br />
        <SelectInput items={motor_type_items} onSelect={handleTypeSelect} />
      </Box>
    );
  } else if (currentStep === 'get_position') {
    return (
      <Box alignItems="center" width="100%" flexDirection="column">
        <Text>Select the position of motor I just moved :</Text>
        <Br />
        <SelectInput items={motor_position_items} onSelect={handlePositionSelect} />
      </Box>
    );
  }
};

export default MotorPinLoop;
