import { configFilePath } from '@robot/rover-app/const.js';
import fs from 'fs-extra';

import type { ExomyConfig } from '@robot/rover-app/types.js';

export default function writeConfig(config: ExomyConfig) {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), { encoding: 'utf8' });
  } catch (e) {
    throw 'unable to write config file';
  }
}
