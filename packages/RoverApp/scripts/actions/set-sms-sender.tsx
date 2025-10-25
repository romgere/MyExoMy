import React, { useState } from 'react';
import { Box, Newline, Text } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';
import { Br } from 'scripts/utils/br.tsx';
import TextInput from 'ink-text-input';
import readConfig from '@robot/rover-app/helpers/read-config.ts';
import writeConfig from '@robot/rover-app/helpers/write-config.ts';

type SetSMSRecipentStep = 'set_recipient' | 'info' | 'done';

export const SetSMSRecipent = ({ onFinish }: PageArg) => {
  const config = readConfig();

  const [currentStep, setStep] = useState<SetSMSRecipentStep>('info');
  const [currentRecipient, setRecipient] = useState(config.smsRecipient ?? '+1234567890');

  useInput((input, key) => {
    if (currentStep === 'info') {
      setStep('set_recipient');
    } else if (currentStep === 'done') {
      onFinish();
    }
    if (input === 'q' || key.escape) {
      onFinish();
    }
  });

  const onSubmitRecipient = () => {
    config.smsRecipient = currentRecipient;
    writeConfig(config);
    setStep('done');
  };

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'set_recipient' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Set SMS recipient phone number (including country code) :</Text>
          <Br />
          <TextInput
            value={currentRecipient}
            placeholder="+1234567890"
            onChange={setRecipient}
            onSubmit={onSubmitRecipient}
          />
          <Br />
          <Text color="yellow" italic>
            Only SMS from this number will be proceed by the rover, if you want to change this see "
            <Text inverse>safe_sms_mode</Text>" setting in <Text underline>/src/const.ts</Text>
          </Text>
        </Box>
      ) : currentStep === 'done' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>SMS recipient has been update in your rover config.</Text>
          <Br />
          <Text color="blue">{currentRecipient}</Text>
          <Newline />
          <Text>Press any key to quit</Text>
        </Box>
      ) : (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>SMS Recipient :</Text>
          <Br />
          <Text>You will be ask to enter the phone number your want the rover to send SMS to.</Text>
          <Text>Current recipient is :</Text>
          <Text backgroundColor="blue" color="white">
            {currentRecipient}
          </Text>
          <Newline />
          <Text>Press any key to continu, press Q or ESC to quit</Text>
        </Box>
      )}
    </Box>
  );
};
