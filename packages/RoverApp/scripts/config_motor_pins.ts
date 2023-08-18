import fs from 'fs-extra';
import prompt from 'prompt';
import asyncPca9685 from '@robot/rover-app/helpers/async-pca-9685.js';
import sleep from '@robot/rover-app/helpers/sleep.js';
import readConfig, { ensureConfigFileExist } from '@robot/rover-app/helpers/read-config.js';
import { configFilePath, WheelPositions, WheelNames } from '@robot/rover-app/const.js';

import type { Pca9685Driver } from 'pca9685';
import type { WheelPosition } from '@robot/rover-app/const.js';

prompt.start();
prompt.message = '';

const motors: Motor[] = [];

class Motor {
  pwm: Pca9685Driver;

  pinNumber: number;
  motorType?: 'steer' | 'drive';
  motorPosition?: WheelPosition;

  constructor(pwm: Pca9685Driver, pin: number) {
    this.pwm = pwm;
    this.pinNumber = pin;
  }

  async wiggleMotor() {
    // Set the motor to the second value
    this.pwm.setPulseRange(this.pinNumber, 0, 200);
    // Wait for 1 seconds
    await sleep(1000);
    // Set the motor to the first value
    this.pwm.setPulseRange(this.pinNumber, 0, 400);
    // Wait for 1 seconds
    await sleep(1000);
    // Set the motor to neutral
    this.pwm.setPulseRange(this.pinNumber, 0, 307);
    // Wait for half seconds
    await sleep(500);
    // Stop the motor
    this.pwm.setPulseRange(this.pinNumber, 0, 0);
  }
}

function printExomyLayout() {
  console.log(`
    1 fl-||-fr 2
         ||
    3 cl-||-cr 4
    5 rl====rr 6
  `);
}

async function updateConfigFile() {
  ensureConfigFileExist();

  const config = await readConfig();

  // Update motors pin value
  for (const motor of motors) {
    if (motor.motorType && motor.motorPosition) {
      config[motor.motorType].pins[motor.motorPosition] = motor.pinNumber;
    }
  }

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

async function main() {
  const pwm = await asyncPca9685();

  console.log(`###############
Motor Configuration

This scripts leads you through the configuration of the motors.
First we have to find out, to which pin of the PWM board a motor is connected.
Look closely which motor moves and type in the answer.

Ensure to run the script until the end, otherwise your changes will not be saved!
This script can always be stopped with ctrl+c and restarted.
All other controls will be explained in the process.
###############`);

  // Stop all motors
  for (let i = 0; i < 16; i++) {
    pwm.setPulseRange(i, 0, 0);
  }

  for (let pinNumber = 0; pinNumber < 16; pinNumber++) {
    const motor = new Motor(pwm, pinNumber);
    await motor.wiggleMotor();

    let type = '';
    // eslint-disable-next-line no-constant-condition
    while (1) {
      console.log(`Pin ${pinNumber}`);
      console.log(
        'Was it a steering or driving motor that moved, or should I repeat the movement? ',
      );
      console.log('(d)rive (s)teer (r)epeat - (n)one (f)inish_configuration');

      const res = await prompt.get(['type']);
      type = res.type as string;

      if (type == 'd') {
        motor.motorType = 'drive';
        console.log('Good job');
        break;
      } else if (type == 's') {
        motor.motorType = 'steer';
        console.log('Good job');
        break;
      } else if (type == 'r') {
        console.log('Look closely');
        await motor.wiggleMotor();
      } else if (type == 'n') {
        console.log(`Skipping pin ${pinNumber}`);
        break;
      } else if (type == 'f') {
        console.log(`Finishing calibration at pin ${pinNumber}`);
        break;
      } else {
        console.log('Input must be d, s, r, n or f');
      }
    }

    if (type == 'd' || type == 's') {
      // eslint-disable-next-line no-constant-condition
      while (1) {
        printExomyLayout();
        console.log('Type the position of the motor that moved.[1-6] or (r)epeat');

        const res = await prompt.get(['position']);
        const position = res.position as string;

        if (position == 'r') {
          console.log('Look closely');
          await motor.wiggleMotor();
        } else {
          const pos = parseInt(position) - 1;
          if (pos >= 0 && pos <= 5) {
            motor.motorPosition = WheelPositions[pos];
            break;
          } else {
            console.log('The input was not a number between 1 and 6');
          }
        }
      }

      motors.push(motor);
      console.log('Motor set!');
      console.log('########################################################');
    } else if (type == 'f') {
      break;
    }
  }

  console.log(
    'Now we will step through all the motors and check whether they have been assigned correctly.',
  );
  console.log('Press ctrl+c if something is wrong and start the script again.');

  for (const motor of motors) {
    if (!motor.motorPosition) {
      continue;
    }

    console.log(`moving ${WheelNames[motor.motorPosition]} ${motor.motorType} motor`);
    printExomyLayout();
    motor.wiggleMotor();
    console.log('Press button to continue');
    await prompt.get(['continue']);
  }

  const nbMotors = Object.keys(motors).length;
  console.log(`You assigned ${nbMotors}/12 motors.`);
  console.log('Write to config file.');
  await updateConfigFile();
  console.log('End of script');
}

main();
