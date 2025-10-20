import React from 'react';
import { TitledBox, titleStyles } from '@mishieck/ink-titled-box';

export const AppLayout = ({ children }: { children?: React.ReactNode | undefined }) => {
  return (
    <TitledBox
      titles={['Rover config center']}
      borderStyle="round"
      titleJustify="center"
      titleStyles={titleStyles.pill}
    >
      {children}
    </TitledBox>
  );
};
