import fs from 'fs-extra';
import prompt from 'prompt';
import asyncPca9685 from '@robot/rover-app/helpers/async-pca-9685.js';
import sleep from '@robot/rover-app/helpers/sleep.js';
import { WheelPosition, WheelPositions, configFilePath } from '@robot/rover-app/const.js';

import type { ServoArray } from '@robot/shared/types.js';
import type { ExomyConfig } from '@robot/rover-app/types.js';
import readConfig from '@robot/rover-app/helpers/read-config.js';

type MotorValueType = 'min' | 'max' | 'neutral';

prompt.start();
prompt.message = '';

function getMotorPins(config: ExomyConfig, motorType: 'steer' | 'drive') {
  return config[motorType].pins;
}

function getPwmValues(
  config: ExomyConfig,
  motorType: 'steer' | 'drive',
  valueType: MotorValueType,
) {
  return config[motorType][valueType];
}

function getPositionName(wheel: WheelPosition) {
  if (wheel === WheelPosition.FL) {
    return 'Front Left';
  } else if (wheel === WheelPosition.FR) {
    return 'Front Right';
  } else if (wheel === WheelPosition.CL) {
    return 'Center Left';
  } else if (wheel === WheelPosition.CR) {
    return 'Center Right';
  } else if (wheel === WheelPosition.RL) {
    return 'Rear Left';
  } else if (wheel === WheelPosition.RR) {
    return 'Rear Right';
  }
}

function updateConfigFile(
  config: ExomyConfig,
  motorType: 'steer' | 'drive',
  neutralValues: ServoArray<number>,
  minValues: ServoArray<number>,
  maxValues: ServoArray<number>,
) {
  config[motorType].max = maxValues;
  config[motorType].min = minValues;
  config[motorType].neutral = neutralValues;

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

async function main(motorType: 'steer' | 'drive') {
  const motorTypeLabel = motorType == 'steer' ? 'steering' : 'driving';

  console.log(`
This script helps you to set the neutral pwm values for the ${motorTypeLabel} motors.
You will iterate over all ${motorTypeLabel} motors and set them to a neutral position then to max & min position.
The determined value is written to the config file.

ctrl+c - Exit script
------------------------------------------------------------------------------
  `);

  if (!fs.existsSync(configFilePath)) {
    console.log('exomy.json does not exist. Finish "config_motor_pins" script to generate it.');
    return;
  }

  const config = await readConfig();
  const pwm = await asyncPca9685();

  /*
    // The cycle is the inverted frequency converted to milliseconds
    let cycle = 1.0 / pwmFrequency * 1000 // ms
    // The time the pwm signal is set to on during the duty cycle
    let onTime = 1.5 // ms
    // Duty cycle is the percentage of a cycle the signal is on
    let duty_cycle = onTime / cycle
    // The PCA 9685 board requests a 12 bit number for the duty_cycle
    let initialValue = parseInt(dutyCycle*4096)
  */

  // Get pins
  const motorPins = getMotorPins(config, motorType);
  // Get neutral, min & max values
  const pwmValues = {
    neutral: getPwmValues(config, motorType, 'neutral'),
    min: getPwmValues(config, motorType, 'min'),
    max: getPwmValues(config, motorType, 'max'),
  };

  // Iterating over all motors
  for (const wheel of WheelPositions) {
    const pinNumber = motorPins[wheel];

    // Fine tune the neutral, min & max value for the motor
    for (const valueType of ['neutral', 'min', 'max'] as MotorValueType[]) {
      let pwmValue = pwmValues[valueType][wheel];

      // eslint-disable-next-line no-constant-condition
      while (1) {
        console.log(`Set ${getPositionName(wheel)} ${motorTypeLabel} motor ${valueType} :`);

        // Set motor
        pwm.setPulseRange(pinNumber, 0, pwmValue);
        sleep(100);
        console.log(`Current value: ${pwmValue}`);

        console.log(
          `Actions :\n - (s)et current value as pwm ${valueType}\n - (D)ecrease pwm ${valueType} value (-5)\n - (d)ecrease a little pwm ${valueType} value (-1)\n - (i)ncrease a little pwm ${valueType} value (+1)\n - (I)ncrease a little pwm ${valueType} value (+5)\n\n - (S)et current value as pwm ${valueType}, SAVE & EXIT script`,
        );
        const { action } = await prompt.get(['action']);
        console.clear();

        if (action == 's') {
          console.log(`PWM ${valueType} value for ${getPositionName(wheel)} has been set.`);
          break;
        } else if (action == 'S') {
          pwmValues[valueType][wheel] = pwmValue;
          updateConfigFile(config, motorType, pwmValues.neutral, pwmValues.min, pwmValues.max);
          console.log(
            'Unfinished configuration, values were written in configuration file anyway...',
          );
          return;
        } else if (action == 'd' || action == 'D') {
          console.log('Decreased pwm neutral value');
          pwmValue -= action == 'd' ? 1 : 5;
        } else if (action == 'i' || action == 'I') {
          console.log('Increased pwm neutral value');
          pwmValue += action == 'i' ? 1 : 5;
        }
      }

      pwmValues[valueType][wheel] = pwmValue;

      pwm.setPulseRange(pinNumber, 0, pwmValues.neutral[wheel]);
    }
  }

  updateConfigFile(config, motorType, pwmValues.neutral, pwmValues.min, pwmValues.max);

  console.log('Finished configuration!!!');
}

const args = process.argv.slice(2);

// Check if the motor type is given as an argument
if (args.length < 1 || (args[0] !== 'steer' && args[0] !== 'drive')) {
  console.log('You must give the type of motor you want to set as argument.');
  console.log('node config_motors_pwm.js steer|drive');
  process.exit();
}

// Set the type of motor to set
const [motorType] = args;

main(motorType);
