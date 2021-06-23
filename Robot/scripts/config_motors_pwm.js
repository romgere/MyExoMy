const path = require('path')
const fs = require('fs-extra')
const YAML = require('yaml')
const prompt = require('prompt')

prompt.start()
prompt.message = ''

const {
  sleep,
  asyncPca9685,
  exomyBigString,
  finisedBigString,
  configFile,
  positionNames
} = require('../misc')

function getMotorPins(config, motorType = 'steer') {

  const pinList = {}
  for (const name of positionNames) {
    pinList[name] = config.get(`pin_${motorType}_${name}`)
  }

  return pinList
}

function getPwmValues(config, motorType = 'steer', valueType) {

  const values = {}
  for (const name of positionNames) {
    values[name] = config.get(`${motorType}_pwm_${valueType}_${name}`)
  }

  return values
}

function getPositionName(name) {
  if (name == 'fl') {
    return 'Front Left'
  } else if (name == 'fr') {
    return 'Front Right'
  } else if (name == 'cl') {
    return 'Center Left'
  } else if (name == 'cr') {
    return 'Center Right'
  } else if (name == 'rl') {
    return 'Rear Left'
  } else if (name == 'rr') {
    return 'Rear Right'
  }
}

function updateConfigFile(config, motorType = 'steer', neutralValues, minValues, maxValues) {

  // Update motors values
  for (const key of positionNames) {
    config.set(`${motorType}_pwm_neutral_${key}`, neutralValues[key])
    config.set(`${motorType}_pwm_min_${key}`, minValues[key])
    config.set(`${motorType}_pwm_max_${key}`, maxValues[key])
  }

  const fileName = path.resolve(__dirname, configFile)
  fs.writeFileSync(fileName, String(config))
}

async function main(motorType) {

  let motorTypeLabel = motorType == 'steer' ? 'steering' : 'driving'

  console.log(exomyBigString)
  console.log(`
This script helps you to set the neutral pwm values for the ${motorTypeLabel} motors.
You will iterate over all ${motorTypeLabel} motors and set them to a neutral position then to max & min position.
The determined value is written to the config file.

ctrl+c - Exit script
------------------------------------------------------------------------------
  `)

  const fileName = path.resolve(__dirname, configFile)
  if (!fs.existsSync(fileName)) {
    console.log('exomy.yaml does not exist. Finish config_motor_pins.py to generate it.')
    return
  }

  const file = fs.readFileSync(fileName, 'utf8')
  const config = YAML.parseDocument(file)

  const pwm = await asyncPca9685()

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
  let motorPins = getMotorPins(config, motorType)
  // Get neutral, min & max values
  let pwmValues = {
    neutral: getPwmValues(config, motorType, 'neutral'),
    min: getPwmValues(config, motorType, 'min'),
    max: getPwmValues(config, motorType, 'max')
  }

  // Iterating over all motors
  for (const pinName of positionNames) {

    let pinNumber = motorPins[pinName]

    // Fine tune the neutral, min & max value for the motor
    for (const valueType of ['neutral', 'min', 'max']) {

      let pwmValue = pwmValues[valueType][pinName]

      // eslint-disable-next-line no-constant-condition
      while (1) {

        console.log(`Set ${getPositionName(pinName)} ${motorTypeLabel} motor ${valueType} :`)

        // Set motor
        pwm.setPulseRange(pinNumber, 0, pwmValue)
        sleep(100)
        console.log(`Current value: ${pwmValue}`)

        console.log(`Actions :\n - (s)et current value as pwm ${valueType}\n - (D)ecrease pwm ${valueType} value (-5)\n - (d)ecrease a little pwm ${valueType} value (-1)\n - (i)ncrease a little pwm ${valueType} value (+1)\n - (I)ncrease a little pwm ${valueType} value (+5)\n - (I)ncrease a little pwm ${valueType} value (+5)\n\n - (S)et current value as pwm ${valueType}, SAVE & EXIT script`)
        let { action } = await prompt.get('action')
        console.clear()

        if (action == 's') {
          console.log(`PWM ${valueType} value for ${getPositionName(pinName)} has been set.`)
          break
        } else if (action == 'S') {
          pwmValues[valueType][pinName] = pwmValue
          updateConfigFile(config, motorType, pwmValues.neutral, pwmValues.min, pwmValues.max)
          console.log('Unfinished configuration, setted value was write in configuration file anyway...')
          return
        } else if (action == 'd' || action == 'D') {
          console.log('Decreased pwm neutral value')
          pwmValue -= action == 'd' ? 1 : 5
        } else if (action == 'i' || action == 'I') {
          console.log('Increased pwm neutral value')
          pwmValue += action == 'i' ? 1 : 5
        }
      }

      pwmValues[valueType][pinName] = pwmValue
    }
  }

  updateConfigFile(config, motorType, pwmValues.neutral, pwmValues.min, pwmValues.max)

  console.log('Finished configuration!!!')
  console.log(finisedBigString)
}

const args = process.argv.slice(2)
// Check if the motor type is given as an argument
if (args.length < 1 || (args[0] !== 'steer' && args[0] !== 'drive')) {
  console.log('You must give the type of motor you want to set as argument.')
  console.log('node config_motors_pwm.js steer|drive')
  process.exit()
}

// Set the type of motor to set
const [motorType] = args

main(motorType)
