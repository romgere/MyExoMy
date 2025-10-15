import { configFilePath } from '@robot/rover-app/const.js';
import fs from 'fs-extra';
import logger from '@robot/rover-app/lib/logger.js';

import type { ExomyConfig } from '@robot/rover-app/types.js';

export function ensureConfigFileExist() {
  const templateFileName = `${configFilePath}.template`;

  if (!fs.existsSync(configFilePath)) {
    fs.copySync(templateFileName, configFilePath);
    logger.log('config template was copied as current config');
  }
}

export default function readConfig(): ExomyConfig {
  ensureConfigFileExist();

  const file = fs.readFileSync(configFilePath, 'utf8');
  try {
    const config = JSON.parse(file) as ExomyConfig;
    return config;
  } catch (e) {
    throw 'unable to load config file';
  }
}
