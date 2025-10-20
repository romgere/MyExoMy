import React, { useEffect, useRef, useState } from 'react';
import { Box } from 'ink';
import { useInput } from 'ink';
import { PageArg } from '../index.tsx';
import { Confirm } from 'scripts/utils/confirm.tsx';
import { Task } from 'ink-task-list';
import spinners from 'cli-spinners';
import asyncPca9685 from '@robot/rover-app/helpers/async-pca-9685.js';
import MotorPinLoop from './pin-loop.tsx';
import MotorConfigTest from './config-test.tsx';
import MotorPinDisclamer from './disclamer.tsx';
import { isConfigValid, MotorConfig, saveMotorConfig } from './misc.ts';
import type { Pca9685Driver } from 'pca9685';

type Step = 'welcome' | 'error' | 'pin_loop' | 'pin_confirm' | 'confirm_save';
export const MotorPin = ({ onFinish }: PageArg) => {
  const [currentStep, setStep] = useState<Step>('welcome');
  const [pca9685, setPca9685] = useState<Pca9685Driver | undefined>();
  const motorConfig = useRef<MotorConfig[] | undefined>(undefined);

  useEffect(() => {
    asyncPca9685().then(setPca9685);
  }, []);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onFinish();
    }

    if (currentStep === 'welcome') {
      setStep('pin_loop');
    }
  });

  // Save new motor config to config file
  const saveAndQuit = () => {
    saveMotorConfig(motorConfig.current!);
    onFinish();
  };

  const onPinConfigFinish = (config: MotorConfig[]) => {
    if (!isConfigValid(config)) {
      setStep('error');
    } else {
      motorConfig.current = config;
      setStep('pin_confirm');
    }
  };

  if (!pca9685) {
    return <Task label="initializing Pca9685 driver..." state="loading" spinner={spinners.dots} />;
  }

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'welcome' ? (
        <MotorPinDisclamer />
      ) : currentStep === 'confirm_save' ? (
        <Confirm
          title="Save new configuration ?"
          message="Save your change to MyExoMy config file (config/exomy.json) ?"
          onConfirm={saveAndQuit}
          onCancel={onFinish}
        />
      ) : currentStep === 'pin_loop' ? (
        <MotorPinLoop driver={pca9685} onFinish={onPinConfigFinish} />
      ) : currentStep === 'pin_confirm' ? (
        <MotorConfigTest
          driver={pca9685}
          config={motorConfig.current ?? []}
          onError={() => setStep('error')}
          onConfirm={() => setStep('confirm_save')}
        />
      ) : (
        <Confirm
          title="Wrong configuration detected"
          message="Configuration seems wrong (all motors aren't set correctly). Retry (yes) or quit (no)"
          onConfirm={() => setStep('pin_loop')}
          onCancel={onFinish}
        />
      )}
    </Box>
  );
};
