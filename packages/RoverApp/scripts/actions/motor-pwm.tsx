import React from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { PageArg } from './index.tsx';

export const MotorPwm = ({ onFinish }: PageArg) => {
  useInput((input, key) => {
    if (input === 'q') {
      // Exit program
    }

    if (key.escape) {
      onFinish();
    }
  });

  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      <Text>Motor PWMMMMM...</Text>
      <Text>Press E...SC to quit</Text>
    </Box>
  );
};
