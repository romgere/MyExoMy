import React from 'react';
import { Box, Newline, Text } from 'ink';
import { Br } from 'scripts/utils/br.tsx';

const MotorPinDisclamer = () => {
  return (
    <Box alignItems="center" width="100%" flexDirection="column">
      <Text>Motor Configuration</Text>
      <Br />
      <Text>This scripts leads you through the configuration of the motors.</Text>
      <Text>First we have to find out, to which pin of the PWM board a motor is connected.</Text>
      <Text>Look closely which motor moves and type in the answer.</Text>
      <Br />
      <Text underline>
        Ensure to run the script until the end, otherwise your changes will not be saved!
      </Text>
      <Text>All other controls will be explained in the process.</Text>
      <Br />
      <Text underline>Press 'q' or 'ESC' at any moment to quit this script.</Text>
      <Br />
      <Newline />
      <Text>Press any key to continu</Text>
    </Box>
  );
};

export default MotorPinDisclamer;
