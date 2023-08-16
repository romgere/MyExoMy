import asyncPca9685 from '@robot/rover-app/helpers/async-pca-9685.js';

// This script simply stops all the motors, in case they were left in a running state.
async function stopMotors() {
  const pwm = await asyncPca9685();

  for (let pin = 0; pin < 16; pin++) {
    pwm.setPulseRange(pin, 0, 0);
  }
}

await stopMotors();
