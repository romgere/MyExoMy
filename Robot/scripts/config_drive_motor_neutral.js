const path = require('path');
const fs = require('fs-extra')
const YAML = require('yaml')
const prompt = require('prompt');
prompt.start();
prompt.message = ''
const {
  sleep,
  asyncPca9685,
  exomyBigString,
  finisedBigString,
  configFile,
  positionNames
} = require('../misc')

config_filename = '../config/exomy.yaml'

const drivePwmNeutralDefault = 300

function getDrivingPins(config) {

  const pinList = []
  for (const pos of positionNames) {
    pinList.push( config.get(`pin_drive_${pos}`))
  }
  
  return pinList
}

function getDrivePwmNeutral(config) {
     
  let value = config.get('drive_pwm_neutral')

  if (!value) {
    console.log('The parameter drive_pwm_neutral could not be found in the exomy.yaml')
    console.log(`It was set to the default value: ${drivePwmNeutralDefault}`)
    return drivePwmNeutralDefault
  }

  return value
}


function setDrivePwmNeutral(config, value) {
     
  // Update value in conf
  config.set('drive_pwm_neutral', value)
  
  const fileName = path.resolve(__dirname, configFile)
  fs.writeFileSync(fileName, String(config))
}

async function main() {

  console.log(exomyBigString)
  console.log(`
This script helps you to set the neutral values of PWM of the driving motors correctly.
It will send the intended signal for "not moving" to all the motors.
On each motor you have to turn the correction screw until the motor really stands still.
  `)

  const fileName = path.resolve(__dirname, configFile)
  if (! fs.existsSync(fileName)) {
    console.log('exomy.yaml does not exist. Finish config_motor_pins.py to generate it.')
    return
  }

  const file = fs.readFileSync(fileName, 'utf8')
  const config = YAML.parseDocument(file)

  const pwm = await asyncPca9685()

  /*
    The drive_pwm_neutral value is determined from the exomy.yaml file.
    But it can be also calculated from the values of the PWM board and motors, 
    like shown in the following calculation:

    # For most motors a pwm frequency of 50Hz is normal
    pwm_frequency = 50.0  # Hz
    pwm.set_pwm_freq(pwm_frequency)

    # The cycle is the inverted frequency converted to milliseconds
    cycle = 1.0/pwm_frequency * 1000.0  # 20 ms

    # The time the pwm signal is set to on during the duty cycle
    on_time = 1.5  # ms

    # Duty cycle is the percentage of a cycle the signal is on
    duty_cycle = on_time/cycle # 0.075

    # The PCA 9685 board requests a 12 bit number for the duty_cycle
    value = int(duty_cycle*4096.0) # 307
  */

  let pwmNeutralValue = getDrivePwmNeutral(config)
  let pinList = getDrivingPins(config)


  while(1) {
    // Set motor
    
    for (const pin of pinList) {
      pwm.setPulseRange(pin, 0, pwmNeutralValue)
    }

    console.log( `Current value: ${pwmNeutralValue}`)
    
    console.log('Actions :\n - (s)et current value as pwm neutral\n - (D)ecrease pwm neutral value (-5)\n - (d)ecrease a little pwm neutral value (-1)\n - (i)ncrease a little pwm neutral value (+1)\n - (I)ncrease a little pwm neutral value (+5)')
    let { action } = await prompt.get('action')

    if(action == 's') {
      
      break
    } else if (action == 'd' || action == 'D'){
      console.log('Decreased pwm neutral value')
      pwmNeutralValue -= action == 'd' ? 1 : 5
    } else if (action == 'i' || action == 'I'){
      console.log('Increased pwm neutral value')
      pwmNeutralValue += action == 'i' ? 1 : 5
    }
  }

  setDrivePwmNeutral(config, pwmNeutralValue)
  console.log(`PWM neutral value for driving motors has been set.`)
  console.log(finisedBigString)
}

main()

