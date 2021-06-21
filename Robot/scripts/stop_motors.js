const { asyncPca9685 } = require('../misc');

// This script simply stops all the motors, in case they were left in a running state. 

async function stopMotors() {
  
  let pwm = await asyncPca9685()

  for (let pin = 0; pin < 16; pin++) {
    pwm.setPulseRange(pin, 0, 0)
  }
}

stopMotors()