const { sleep, asyncPca9685, pwmFrequency } = require('../misc');
var prompt = require('prompt');
prompt.start();
prompt.message = ''
/**
 * This script helps to test pwm motors with the Adafruit PCA9685 board 
 * 
 * Example usage:
 * node motor_test.js 3
 *
 * Performs a motor test for the motor connected to pin 3 of the PWM board
 */

const args = process.argv.slice(2);

// Check if the pin number is given as an argument
if (args.length < 1 ){
  console.log('You must give the pin number of the motor to be tested as argument.')
  console.log('E.g: node motor_test.js 3')
  console.log('Tests the motor connected to pin 3.')
  process.exit()
}

// Set the pin of the motor
const pin = parseInt(args[0])
console.log('Pin', pin)

// The cycle is the inverted frequency converted to milliseconds
const cycle = 1 / pwmFrequency * 1000 //ms 

// // The time the pwm signal is set to on during the duty cycle
// const onTime = 2.0 // ms

async function testLoop(pwm) {
  
  while(true) {
  
    console.log(`What do you want to test?\n1: Min to Max oscilation\n2: Incremental positioning\n0: Abort`)
    let { mode } = await prompt.get('mode')
    
    if (mode == 0) {
      break
    }
    else if (mode == 1) {

      let minT = 0.5 // ms
      let maxT = 2.5 // ms
      let midT = minT + maxT / 2

      console.log(`pulsewidth_min = ${minT}, pulsewidth_max = ${maxT}`)

      // *_dc is the percentage of a cycle the signal is on
      let minDc = minT / cycle
      let maxDc = maxT / cycle
      let midDc = midT / cycle
      
      let dcList = [minDc, midDc, maxDc, midDc, minDc, midDc, maxDc]
      for (const dc of dcList) {
        console.log('set', dc*4096)
        pwm.setPulseRange(pin, 0, dc*4096)
        await sleep(500)
      }
    } else if (mode == 2) {
  
      let currT = 1.5 // ms
      let currDc = currT / cycle
      
      let stepSize = 0.1 // ms      
      let stepSizeScaling = 0.2
                  
      while (true){

        console.log('a-d: change pulsewidth\nw-s: change step size\n0: back to menu')
        const { action } = await prompt.get('action')

        if (action == 0) {
          break
        }

        switch(action) {
          case 'a' :
            currT = currT - stepSize
            break;
          case 'd' :
            currT = currT + stepSize
            break;
          case 's' :
            stepSize = stepSize * (1 - stepSizeScaling)
            break;
          case 'w' :
            stepSize = stepSize * (1 + stepSizeScaling)
            break;
        }

        currDc = currT / cycle
          
        let currPwm = Math.max(currDc, 0) * 4096
        console.log(` t_current:\t${currT} [ms]\nstep_size:\t${stepSize} [ms]\ncurr_pwm: ${currPwm}`)
        pwm.setPulseRange(pin, 0, currPwm)
      }
    }
  }
}

async function main() {
  const pwm = await asyncPca9685()
  testLoop(pwm).finally(function() {
    // reset motor
    pwm.setPulseRange(pin, 0, 0)
  })
}

main()