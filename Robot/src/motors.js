const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;

const {
  positionNames
} = require('../misc')

// Motors class contains all functions to control the steering and driving
class Motors {
     
  // Motor commands are assuming positiv=driving_forward, negative=driving_backwards.
  // The driving direction of the left side has to be inverted for this to apply to all wheels.
  wheelDirections = [-1, 1, -1, 1, -1, 1]

  async init() {

    // Set variables for the GPIO motor pins
    this.pins = {
      drive: await Promise.all(positionNames.map((pos) => nh.getParam(`pin_drive_${pos}`))),
      steer: await Promise.all(positionNames.map((pos) => nh.getParam(`pin_steer_${pos}`)))
    }

    this.pwm = await asyncPca9685()

    // PWM characteristics
    this.steeringPwmNeutral = await Promise.all(positionNames.map((pos) => nh.getParam(`steer_pwm_neutral_${pos}`)))
    this.steeringPwmRange = await nh.getParam('steer_pwm_range')

    this.drivingPwmLowLimit = 100
    this.drivingPwmUpperLimit = 500
    this.drivingPwmNeutral = await nh.getParam("drive_pwm_neutral")
    this.drivingPwmRange = await nh.getParam("drive_pwm_range")

    // Set steering motors to neutral values (straight)
    for (const key in positionNames) {
      this.pwm.setPulseRange(
        this.pins.steer[key],
        0,
        self.steeringPwmNeutral[key]
      )
      await sleep(100) 
    }

    await this.wiggle()
  }

  async wiggle() {
      await sleep(100)
      this.pwm.setPulseRange(this.pins.steer[0], 0, this.steeringPwmNeutral[0] + this.steeringPwmRange * 0.3)
      await sleep(100)
      this.pwm.setPulseRange(this.pins.steer[1], 0, this.steeringPwmNeutral[0] + this.steeringPwmRange * 0.3)
      await sleep(300)
      this.pwm.setPulseRange(this.pins.steer[0], 0, this.steeringPwmNeutral[0] - this.steeringPwmRange * 0.3)
      await sleep(100)
      this.pwm.setPulseRange(this.pins.steer[1], 0, this.steeringPwmNeutral[0] - this.steeringPwmRange * 0.3)
      await sleep(300)
      this.pwm.setPulseRange(this.pins.steer[0], 0, this.steeringPwmNeutral[0])
      await sleep(100)
      this.pwm.setPulseRange(this.pins.steer[1], 0, this.steeringPwmNeutral[0])
      await sleep(300)
  }

  setSteering(steeringCommand) {
    for (const key in positionNames) {
      let dutyCycle = parseInt(
        this.steeringPwmNeutral[key]
        + steeringCommand[key] / 90
        * this.steeringPwmRange
      )

      self.pwm.setPulseRange(this.pins.steer[key], 0, dutyCycle)
    }
  }

  setDriving(drivingCommand) {
    for (const key in positionNames) {
      let dutyCycle = parseInt(
        this.drivingPwmNeutral
        + drivingCommand[key] / 100
        * this.drivingPwmRange
        * this.wheelDirections[key]
      )

      this.pwm.setPulseRange(this.pins.drive[key], 0, dutyCycle)
    }
  }

  // Set driving wheels to neutral position to stop them
  stopMotors() {
    let dutyCycle = this.drivingPwmNeutral
    for (const key in positionNames) {
      this.pwm.setPulseRange(this.pins.drive[key], 0, dutyCycle)
    }
  }
}

module.exports = Motors