import { configFilePath } from '@robot/rover-app/const.js';
import fs from 'fs-extra';
import logger from '@robot/rover-app/lib/logger.js';

import type { ExomyConfig } from '@robot/rover-app/types.js';

export async function ensureConfigFileExist() {
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
