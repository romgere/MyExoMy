const path = require('path');
const fs = require('fs-extra')
const YAML = require('yaml')
const prompt = require('prompt');
prompt.start();
prompt.message = ''
const {
  sleep,
  pwmFrequency,
  asyncPca9685,
  exomyBigString,
  finisedBigString,
  configFile,
  positionNames
} = require('../misc')

config_filename = '../config/exomy.yaml'

function getSteeringMotorPins(config) {

  const pinList = {}
  for (const name of positionNames) {
    pinList[name] = config.get(`pin_steer_${name}`)
  }
  
  return pinList
}

function getSteeringPwmNeutralValues(config) {

  const neutralValues = {}
  for (const name of positionNames) {
    neutralValues[name] = config.get(`steer_pwm_neutral_${name}`)
  }
  
  return neutralValues
}

function getPositionName(name) {
  if(name == 'fl') {
    return 'Front Left'
  } else if(name == 'fr') {
    return 'Front Right'
  } else if(name == 'cl') {
    return 'Center Left'
  } else if(name == 'cr') {
    return 'Center Right'
  } else if(name == 'rl') {
    return 'Rear Left'
  } else if(name == 'rr') {
    return 'Rear Right'
  }
}


function updateConfigFile(config, neutralValues) {

  // Update motors pin value
  for (const key in neutralValues) {    
    config.set(`steer_pwm_neutral_${key}`, neutralValues[key])
  }
  
  const fileName = path.resolve(__dirname, configFile)
  fs.writeFileSync(fileName, String(config))
}

async function main() {

  console.log(exomyBigString)
  console.log(`
This script helps you to set the neutral pwm values for the steering motors.
You will iterate over all steering motors and set them to a neutral position.
The determined value is written to the config file.

Commands:
a - Decrease value for current pin
d - Increase value for current pin
q - Finish setting value for current pin

[Every of these commands must be confirmed with the enter key]

ctrl+c - Exit script
------------------------------------------------------------------------------
  `)

  const fileName = path.resolve(__dirname, configFile)
  if (! fs.existsSync(fileName)) {
    console.log('exomy.yaml does not exist. Finish config_motor_pins.py to generate it.')
    return
  }

  const file = fs.readFileSync(fileName, 'utf8')
  const config = YAML.parseDocument(file)
 
  const pwm = await asyncPca9685()
    
  // // The cycle is the inverted frequency converted to milliseconds
  // let cycle = 1.0 / pwmFrequency * 1000 // ms
  // // The time the pwm signal is set to on during the duty cycle
  // let onTime = 1.5 // ms
  // // Duty cycle is the percentage of a cycle the signal is on
  // let duty_cycle = onTime / cycle
  // // The PCA 9685 board requests a 12 bit number for the duty_cycle
  // let initialValue = parseInt(dutyCycle*4096)

  // Get all steering pins
  let steeringMotorPins = getSteeringMotorPins(config)
  let pwmNeutralValues = getSteeringPwmNeutralValues(config)
  

  // Iterating over all motors and fine tune the zero value
  for (const pinName of positionNames) {

    let pinNumber = steeringMotorPins[pinName]
    let pwmNeutralValue = pwmNeutralValues[pinName] 

    console.log(`Set ${getPositionName(pinName)} steering motor:`)

    while(1) {
      // Set motor
      pwm.setPulseRange(pinNumber, 0, pwmNeutralValue)
      sleep(100)
      console.log( `Current value: ${pwmNeutralValue}`)
      
      console.log('(s)et current value as pwm neutral / (d)ecrease pwm neutral value/ (i)ncrease pwm neutral value')
      let { action } = await prompt.get('action')

      if(action == 's') {
        console.log(`PWM neutral value for ${getPositionName(pinName)} has been set.`)
        break
      } else if (action == 'd' ){
        console.log('Decreased pwm neutral value')
        pwmNeutralValue -= 5
      } else if (action == 'i' ){
        console.log('Increased pwm neutral value')
        pwmNeutralValue += 5
      }
    }

    pwmNeutralValues[pinName] = pwmNeutralValue
  }
  
  updateConfigFile(config, pwmNeutralValues)

  console.log("Finished configuration!!!")
  console.log(finisedBigString)
}

main()