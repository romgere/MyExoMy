import { configFilePath } from '@exomy/robot/lib/const.js';
import fs from 'fs-extra';
import logger from '@exomy/robot/lib/logger.js';

import type { ExomyConfig } from '@exomy/robot/types.js';

async function ensureConfigFileExist() {
  const templateFileName = `${configFilePath}.template`;

  if (!(await fs.exists(configFilePath))) {
    await fs.copy(templateFileName, configFilePath);
    logger.log('config template was copied as current config');
  }
}

export default async function readConfig(): Promise<ExomyConfig> {
  await ensureConfigFileExist();

  const file = await fs.readFile(configFilePath, 'utf8');
  try {
    const config = JSON.parse(file) as ExomyConfig;
    return config;
  } catch (e) {
    throw 'unable to load config file';
  }
}
