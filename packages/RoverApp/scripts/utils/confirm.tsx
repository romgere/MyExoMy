import React from 'react';
import { Box, useInput, Text } from 'ink';
import { useState } from 'react';
import { TitledBox } from '@mishieck/ink-titled-box';
import { Br } from './br.tsx';

export type ConfirmArg = {
  message: string;
  title: string;
  confirmBtnLabel?: string;
  cancelBtnLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode | undefined;
};

type Buttons = 'yes' | 'no';

export const Confirm = ({
  message,
  title,
  onConfirm,
  onCancel,
  confirmBtnLabel,
  cancelBtnLabel,
  children,
}: ConfirmArg) => {
  const [focused, setFocused] = useState<Buttons | undefined>();

  useInput((input, key) => {
    if (input === 'y') {
      onConfirm();
    } else if (input === 'n') {
      onCancel();
    } else if (key.leftArrow || key.rightArrow || key.tab) {
      setFocused(focused === 'yes' ? 'no' : 'yes');
    } else if (key.return && focused === 'yes') {
      onConfirm();
    } else if (key.return && focused === 'no') {
      onCancel();
    }
  });

  return (
    <Box padding={2}>
      <TitledBox titles={[title]} borderStyle="round">
        <Box alignItems="center" flexDirection="column" padding={1}>
          <Text>{message}</Text>
          {children}
          <Br />
          <Box alignItems="stretch" flexGrow={1} backgroundColor="red">
            <Box
              paddingX={1}
              borderStyle="single"
              borderColor={focused === 'no' ? 'blue' : 'white'}
              backgroundColor={focused === 'no' ? 'white' : 'black'}
            >
              <Text color={focused === 'no' ? 'blue' : 'white'}>{confirmBtnLabel ?? 'No'}</Text>
            </Box>
            <Box
              paddingX={1}
              borderStyle="single"
              borderColor={focused === 'yes' ? 'blue' : 'white'}
              backgroundColor={focused === 'yes' ? 'white' : 'black'}
            >
              <Text color={focused === 'yes' ? 'blue' : 'white'}>{cancelBtnLabel ?? 'Yes'}</Text>
            </Box>
          </Box>
        </Box>
      </TitledBox>
    </Box>
  );
};
