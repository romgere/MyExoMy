import React, { useState } from 'react';
import { render, Text, Box, useInput, useApp, Spacer } from 'ink';
import SelectInput from 'ink-select-input';
import { AppLayout } from './utils/app-layout.tsx';
import pages, { PageName, pageNames } from './actions/index.tsx';
import { Task } from 'ink-task-list';
import { Br } from './utils/br.tsx';
import { argv, exit } from 'process';

type MainMenuEntry = PageName | 'quit';

const Main = ({ landingPage }: { landingPage?: PageName }) => {
  const [page, setPage] = useState<PageName | undefined>(landingPage);

  const { exit } = useApp();

  useInput(
    (input, key) => {
      if (input === 'q' || key.escape) {
        exit();
      }
    },
    { isActive: page === undefined },
  );

  const handleSelect = ({ value }: { value: PageName | 'quit' }) => {
    if (value === 'quit') {
      exit();
    } else {
      setPage(value);
    }
  };

  const onFinish = () => {
    if (landingPage) {
      exit();
    } else {
      setPage(undefined);
    }
  };

  const pageItems = [
    ...pageNames.map((p: PageName) => {
      return {
        value: p as MainMenuEntry,
        label: pages[p].label,
      };
    }),
    { value: 'quit' as MainMenuEntry, label: 'Quit' },
  ];

  if (page) {
    const Page = pages[page].page;
    return (
      <AppLayout>
        <Page onFinish={onFinish}></Page>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box alignItems="center" width="100%" minHeight={15} flexDirection="column">
        <Text>Welcome to your Rover configuration App !</Text>
        <Br />
        <Task label="Please select an action :" isExpanded></Task>
        <Br />
        <SelectInput items={pageItems} onSelect={handleSelect} />
        <Spacer />
        <Text italic>
          Press <Text inverse>ESC</Text> to quit.
        </Text>
      </Box>
    </AppLayout>
  );
};

const landingPage = argv[2] as PageName;
if (landingPage && !pages[landingPage]) {
  console.log(
    `Unknow action "${landingPage}", please use one of the following :`,
    Object.keys(pages).join(', '),
  );
  exit(1);
}
render(<Main landingPage={landingPage} />);
