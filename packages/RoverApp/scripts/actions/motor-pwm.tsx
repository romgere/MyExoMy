import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, Newline } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';
import { Br } from 'scripts/utils/br.tsx';
import { WheelPosition } from '@robot/rover-app/const.ts';
import {
  getMotorPin,
  getMotorPWMValue,
  PWMValueType,
  setMotorPWMValue,
  wheelPositionLabels,
  type MotorType,
} from 'scripts/utils/motor.ts';
import SelectInput from 'ink-select-input';
import asyncPca9685 from '@robot/rover-app/helpers/async-pca-9685.ts';
import { Task } from 'ink-task-list';
import spinners from 'cli-spinners';
import type { Pca9685Driver } from 'pca9685';
import readConfig from '@robot/rover-app/helpers/read-config.ts';
import { ExomyConfig } from '@robot/rover-app/types.js';

const motor_type_items: { value: MotorType | 'back'; label: string }[] = [
  {
    value: 'driving',
    label: 'Driving motor - 360° servo',
  },
  {
    value: 'steering',
    label: 'Steering motor - 180° servo',
  },
  {
    value: 'back',
    label: 'Quit',
  },
];

const wheel_position_items: { value: WheelPosition | 'back'; label: string }[] = [
  { value: WheelPosition.FL, label: wheelPositionLabels[WheelPosition.FL] },
  { value: WheelPosition.FR, label: wheelPositionLabels[WheelPosition.FR] },
  { value: WheelPosition.CL, label: wheelPositionLabels[WheelPosition.CL] },
  { value: WheelPosition.CR, label: wheelPositionLabels[WheelPosition.CR] },
  { value: WheelPosition.RL, label: wheelPositionLabels[WheelPosition.RL] },
  { value: WheelPosition.RR, label: wheelPositionLabels[WheelPosition.RR] },
  { value: 'back', label: 'Go back (select motor type)' },
];

const value_type_items: { value: PWMValueType | 'back'; label: string }[] = [
  {
    value: 'min',
    label: 'Set PWN min',
  },
  {
    value: 'neutral',
    label: 'Set PWN neutral',
  },
  {
    value: 'max',
    label: 'Set PWN max',
  },
  {
    value: 'back',
    label: 'Go Back (select wheel position)',
  },
];

type MotorPwmStep =
  | 'welcome'
  | 'choose_motor_type'
  | 'choose_wheel_position'
  | 'choose_value_type'
  | 'set_value';

export const MotorPwm = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<MotorPwmStep>('welcome');
  const [motorType, setMotorType] = useState<MotorType>();
  const [wheelPosition, setWheelPosition] = useState<WheelPosition>();
  const [valueType, setValueType] = useState<PWMValueType>();
  const [pca9685, setPca9685] = useState<Pca9685Driver | undefined>();

  const config = useRef<ExomyConfig>(undefined);

  useEffect(() => {
    config.current = readConfig();
    asyncPca9685().then(setPca9685);
  }, []);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onFinish();
    }

    if (currentStep === 'welcome') {
      setStep('choose_motor_type');
    }
  });

  const handleMotorTypeSelect = ({ value }: { value: MotorType | 'back' }) => {
    if (value === 'back') {
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
      setStep('choose_value_type');
    }
  };

  const handleValueTypeSelect = ({ value }: { value: PWMValueType | 'back' }) => {
    if (value === 'back') {
      setStep('choose_wheel_position');
    } else {
      setValueType(value);
      setStep('set_value');
    }
  };

  if (!pca9685 || !config.current) {
    return <Task label="initializing Pca9685 driver..." state="loading" spinner={spinners.dots} />;
  }

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'welcome' ? (
        <MotorPwmDisclamer />
      ) : currentStep === 'choose_motor_type' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Select the type of motor to adjust :</Text>
          <Br />
          <SelectInput items={motor_type_items} onSelect={handleMotorTypeSelect} />
        </Box>
      ) : currentStep === 'choose_wheel_position' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>
            Select the position of{' '}
            <Text underline color="blue">
              {motorType}
            </Text>{' '}
            motor to adjust :
          </Text>
          <Br />
          <SelectInput items={wheel_position_items} onSelect={handleWheelPositionSelect} />
        </Box>
      ) : currentStep === 'choose_value_type' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>
            Select the PWM value you want to adjust on{' '}
            <Text underline color="blue">
              {wheelPositionLabels[wheelPosition!]} {motorType}
            </Text>{' '}
            motor :
          </Text>
          <Br />
          <SelectInput items={value_type_items} onSelect={handleValueTypeSelect} />
        </Box>
      ) : (
        <SetValuePwnValue
          motorType={motorType!}
          position={wheelPosition!}
          valueType={valueType!}
          driver={pca9685}
          onFinish={(newValue: number) => {
            setMotorPWMValue(newValue, motorType!, wheelPosition!, valueType!, config.current!);
            setStep('choose_motor_type');
          }}
          pin={getMotorPin(motorType!, wheelPosition!, config.current)}
          initialPWM={getMotorPWMValue(motorType!, wheelPosition!, valueType!, config.current)}
        />
      )}
    </Box>
  );
};

const MotorPwmDisclamer = () => {
  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      <Text>Adjust motors PWM</Text>
      <Br />
      <Text>This script helps you to set the neutral, min & max PWM values for your motors.</Text>
      <Text>You will choose a motor & type of value (neutral, min & max) to set.</Text>
      <Text>
        Script will allow you to fine tune the value then value will be written to the config file.
      </Text>
      <Br />
      <Text underline>Press 'q' or 'ESC' at any moment to quit this script.</Text>
      <Br />
      <Newline />
      <Text>Press any key to continu</Text>
    </Box>
  );
};

type SetValuePwnValueArg = {
  motorType: MotorType;
  position: WheelPosition;
  valueType: PWMValueType;
  driver: Pca9685Driver;
  pin: number;
  initialPWM: number;
  onFinish: (value: number) => void;
};

const SetValuePwnValue = ({
  motorType,
  position,
  valueType,
  driver,
  pin,
  initialPWM,
  onFinish,
}: SetValuePwnValueArg) => {
  const [currentPWM, setPWM] = useState(initialPWM);

  useInput((_input, key) => {
    if (key.pageUp || (key.upArrow && key.shift)) {
      setPWM(currentPWM + 5);
    } else if (key.upArrow) {
      setPWM(currentPWM + 1);
    } else if (key.pageDown || (key.downArrow && key.shift)) {
      setPWM(currentPWM - 5);
    } else if (key.downArrow) {
      setPWM(currentPWM - 1);
    } else if (key.return) {
      onFinish(currentPWM);
    }
  });

  driver.setPulseRange(pin, 0, currentPWM);

  const motorLabel = `${wheelPositionLabels[position]} ${motorType} motor`;

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      <Text>
        Please adjusting{' '}
        <Text underline color="blue">
          {motorLabel}
        </Text>{' '}
        <Text underline color="blue">
          {valueType}
        </Text>{' '}
        PWM value as needed.
      </Text>
      <Br />
      <Text>
        Current PWM value :{' '}
        <Text inverse color="blue">
          {currentPWM}
        </Text>
      </Text>
      <Newline />
      <Box alignItems="flex-start" flexDirection="column">
        <Text>
          {' '}
          - increase PWM by 5 : <Text inverse>page up</Text> or <Text inverse>Shift + up</Text>
        </Text>
        <Text>
          {' '}
          - increase PWM by 1 : <Text inverse>up</Text>
        </Text>
        <Text>
          {' '}
          - decrease PWM by 1 : <Text inverse>down</Text>
        </Text>
        <Text>
          {' '}
          - decrease PWM by 5 : <Text inverse>page down</Text> or <Text inverse>Shift + down</Text>
        </Text>
      </Box>
      <Br />
      <Text>
        Press <Text inverse>Enter</Text> to save value to configuration file.
      </Text>
      <Text>
        Press <Text inverse>q</Text> or <Text inverse>ESC</Text> to quit.
      </Text>
    </Box>
  );
};
