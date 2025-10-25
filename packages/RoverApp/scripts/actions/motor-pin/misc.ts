import { WheelPosition, configFilePath } from '@robot/rover-app/const.js';
import readConfig, { ensureConfigFileExist } from '@robot/rover-app/helpers/read-config.js';
import writeConfig from '@robot/rover-app/helpers/write-config.ts';
import fs from 'fs-extra';
import type { MotorType } from 'scripts/utils/motor.ts';

export type MotorConfig = {
  pin: number;
  type: MotorType;
  position: WheelPosition;
};

// Check if user config is OK (12 motor set, 6 steer / 6 driving & no overlap)
export function isConfigValid(config: MotorConfig[]) {
  if (config.length !== 12) {
    return false;
  }

  const pins = new Set(config.map(({ pin }) => pin));
  if (pins.size !== 12) {
    return false;
  }

  const steering = config.filter(({ type }) => type === 'steering');
  const driving = config.filter(({ type }) => type === 'driving');
  if (steering.length !== 6 || driving.length !== 6) {
    return false;
  }

  return true;
}

export function saveMotorConfig(motorConfig: MotorConfig[]) {
  ensureConfigFileExist();

  const roverConfig = readConfig();

  // Update motors pin value
  for (const motor of motorConfig) {
    roverConfig[motor.type === 'driving' ? 'drive' : 'steer'].pins[motor.position] = motor.pin;
  }

  writeConfig(roverConfig);
}
