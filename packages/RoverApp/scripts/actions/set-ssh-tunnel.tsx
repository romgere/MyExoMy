import React, { useState } from 'react';
import { Box, Newline, Text } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';
import { Br } from 'scripts/utils/br.tsx';
import TextInput from 'ink-text-input';
import readConfig from '@robot/rover-app/helpers/read-config.ts';
import writeConfig from '@robot/rover-app/helpers/write-config.ts';
import Link from 'ink-link';
import { Confirm } from 'scripts/utils/confirm.tsx';
import { Task, TaskList } from 'ink-task-list';

type SetSMSRecipentStep = 'set_username' | 'auto_connect' | 'set_username' | 'info' | 'done';

export const SetSSHTunnel = ({ onFinish }: PageArg) => {
  const config = readConfig();

  const [currentStep, setStep] = useState<SetSMSRecipentStep>('info');
  const [currentUsername, setUsername] = useState(config.gitHubUsername ?? '');
  const currentAutoConnect = config.sshTunnelAutoStart;

  useInput((input, key) => {
    if (currentStep === 'auto_connect') {
      return;
    } else if (currentStep === 'info') {
      setStep('set_username');
    } else if (currentStep === 'done') {
      onFinish();
    }

    if (input === 'q' || key.escape) {
      onFinish();
    }
  });

  const onSubmit = () => {
    setStep('auto_connect');
  };

  const updateConf = (autoConnect: boolean) => {
    config.gitHubUsername = currentUsername;
    config.sshTunnelAutoStart = autoConnect;
    writeConfig(config);
    setStep('done');
  };

  const onConfirmAutoConnect = () => {
    updateConf(true);
  };
  const onCancelAutoConnect = () => {
    updateConf(false);
  };

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      {currentStep === 'set_username' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Enter your GitHub username :</Text>
          <Br />
          <TextInput
            value={currentUsername}
            placeholder="GH username"
            onChange={setUsername}
            onSubmit={onSubmit}
          />
          <Br />
          <Text italic>This allow SSH tunnel service to attribute prediactable hostname.</Text>
        </Box>
      ) : currentStep === 'done' ? (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>Configuration updated !</Text>
          <Newline />
          <Text>Rover configuration has been updated with new settings :</Text>
          <Br />
          <TaskList>
            <Task label={`Username: ${currentUsername}`} state="pending" />
            <Task label={`Auto-start: ${currentAutoConnect ? 'ON' : 'OFF'}`} state="pending" />
          </TaskList>
          <Newline />
          <Text>Press any key to quit</Text>
        </Box>
      ) : currentStep === 'auto_connect' ? (
        <Confirm
          onCancel={onCancelAutoConnect}
          onConfirm={onConfirmAutoConnect}
          title="Auto Start SSH"
          message="Enable SSH tunnel auto start ?"
        >
          <Text>
            Current setting:{' '}
            <Text color={currentAutoConnect ? 'green' : 'red'}>
              {currentAutoConnect ? 'ON' : 'OFF'}
            </Text>
          </Text>
          <Br />
          <Text color="yellow" italic>
            Enable this settings with caution, first ensure your 4G connection is correctly
            configured & SSH tunnel settings (GH username) is correct.
          </Text>
        </Confirm>
      ) : (
        <Box alignItems="center" width="100%" flexDirection="column">
          <Text>SSH Tunnel :</Text>
          <Br />
          <Text>
            You will be ask to enter your github username. It username will be used to set up the
            SSH tunnel to access your rover when connected to the 4G network.
          </Text>
          <Br />
          <Text>
            See{' '}
            <Link url="https://github.com/romgere/MyExoMy/wiki/SIM7600E%E2%80%90H-4G-HAT#ssh-tunnel">
              <Text color="blue" underline>
                project wiki page
              </Text>
            </Link>{' '}
            or{' '}
            <Link url="https://docs.srv.us/">
              <Text color="blue" underline>
                https://docs.srv.us/
              </Text>
            </Link>{' '}
            for more details
          </Text>
          <Newline />
          <Text>Press any key to continu, press Q or ESC to quit</Text>
        </Box>
      )}
    </Box>
  );
};
