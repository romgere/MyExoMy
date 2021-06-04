const path = require('path');
const fs = require('fs-extra')
const YAML = require('yaml')
var prompt = require('prompt');
prompt.start();
prompt.message = ''
const {
  sleep,
  asyncPca9685,
  pwmFrequency,
  exomyBigString,
  finisedBigString
} = require('./_misc')

const posNames = {
  1: 'fl',
  2: 'fr',
  3: 'cl',
  4: 'cr',
  5: 'rl',
  6: 'rr'
}

let motors = {}


// The cycle is the inverted frequency converted to milliseconds
let cycle = 1 / pwmFrequency * 1000 // ms

// The time the pwm signal is set to on during the duty cycle
let onTime1 = 2.4 // ms
let onTime2 = 1.5 // ms

// Duty cycle is the percentage of a cycle the signal is on
let dutyCycle1 = onTime1 / cycle
let dutyCycle2 = onTime2 / cycle

// The PCA 9685 board requests a 12 bit number for the duty_cycle
let value1 = 200 // int(duty_cycle_1*4096.0)
let value2 = 400 // int(duty_cycle_2*4096.0)

class Motor {
  
  pwm = undefined
  
  pinNumber = undefined
  motorType = undefined
  motorSlot = undefined

  get pinName () {
    return `pin_${this.motorType}_${this.motorSlot}`
  } 

  constructor(pwm, pin) {
    this.pwm = pwm
    this.pinNumber = pin
  }

  async wiggleMotor() {
    // Set the motor to the second value
    this.pwm.setPulseRange(this.pinNumber, 0, value2)
    // Wait for 1 seconds
    await sleep(1000)
    // Set the motor to the first value
    this.pwm.setPulseRange(this.pinNumber, 0, value1)
    // Wait for 1 seconds
    await sleep(1000)
    // Set the motor to neutral
    this.pwm.setPulseRange(this.pinNumber, 0, 307)
    // Wait for half seconds
    await sleep(500)
    // Stop the motor
    this.pwm.setPulseRange(this.pinNumber, 0, 0)
  }
}

function printExomyLayout() {
  console.log(`
    1 fl-||-fr 2
        ||
    3 cl-||-cr 4
    5 rl====rr 6
  `)
}
    

function updateConfigFile() {
  const fileName = path.resolve(__dirname, '../../config/exomy.yaml')
  const templateFileName = `${fileName}.template`

  if (! fs.existsSync(fileName)) {
    fs.copySync(templateFileName, fileName)
    console.log('exomy.yaml.template was copied to exomy.yaml')
  }

  let output = ''
  
  const file = fs.readFileSync(fileName, 'utf8')
  const document = YAML.parseDocument(file)

  // Update motors pin value
  for (const key in motors) {    
    document.set(motors[key].pinName, motors[key].pinNumber)
  }

  fs.writeFileSync(fileName, String(document))
}


async function main() {

  const pwm = await asyncPca9685()

  console.log(exomyBigString)
  console.log(`###############
  Motor Configuration
  
  This scripts leads you through the configuration of the motors.
  First we have to find out, to which pin of the PWM board a motor is connected.
  Look closely which motor moves and type in the answer.
  
  Ensure to run the script until the end, otherwise your changes will not be saved!
  This script can always be stopped with ctrl+c and restarted.
  All other controls will be explained in the process.
###############`)

  // Stop all motors
  for (let i = 0; i < 16; i++) {
    pwm.setPulseRange(i, 0, 0)
  }

  for (let pinNumber = 0; pinNumber < 16; pinNumber++) {

    let motor = new Motor(pwm, pinNumber)
    await motor.wiggleMotor()

    let type_selection = ''
    while(1) {
      console.log(`Pin ${pinNumber}`)
      console.log('Was it a steering or driving motor that moved, or should I repeat the movement? ')
      console.log('(d)rive (s)teer (r)epeat - (n)one (f)inish_configuration')

      let res = await prompt.get('type')
      type_selection = res.type
      if (type_selection == 'd') {
        motor.motorType = 'drive'
        console.log('Good job')
        break
      } else if(type_selection == 's') {
        motor.motorType = 'steer'
        console.log('Good job')
        break
      }
      else if(type_selection == 'r') {
        console.log('Look closely')
        await motor.wiggleMotor()
      }
      else if(type_selection == 'n') {
        console.log(`Skipping pin ${pinNumber}`)
        break
      }
      else if(type_selection == 'f') {
        console.log(`Finishing calibration at pin ${pinNumber}`)
        break
      }
      else {
        console.log('Input must be d, s, r, n or f')
      }
    }
    
            
        
    if (type_selection == 'd' || type_selection == 's') {
      while(1) {
        printExomyLayout()
        console.log('Type the position of the motor that moved.[1-6] or (r)epeat')

        let { position_type } = await prompt.get('position_type')

        if(position_type == 'r') {
          console.log('Look closely')
          await motor.wiggleMotor()
        } else {
          
          pos = parseInt(position_type)
          if(pos >= 1 && pos <= 6) {
            motor.motorSlot = posNames[pos]
            break
          } else { 
            console.log('The input was not a number between 1 and 6')
          }
        }
      }
      
      motors[motor.pinName] = motor
      console.log('Motor set!')
      console.log('########################################################')
    } else if (type_selection == 'f') {
      break
    }
  }
    
  console.log('Now we will step through all the motors and check whether they have been assigned correctly.')
  console.log('Press ctrl+c if something is wrong and start the script again.')
  
  for (const key in motors) {
    console.log(`moving ${motors[key].pinName}`)
    printExomyLayout()    
    motors[key].wiggleMotor()
    console.log('Press button to continue')
    await prompt.get('continue')
  }
  
  let nbMotors = Object.keys(motors).length
  console.log(`You assigned ${nbMotors}/12 motors.`)
  console.log('Write to config file.')
  updateConfigFile()  
  console.log(finisedBigString)
}

main()