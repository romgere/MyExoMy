const {
  positionNames,
  asyncPca9685,
  sleep
} = require('../misc')

function getServoSettingsArray(confBaseName, motorNode) {
  return Promise.all(positionNames.map((pos) => motorNode.getParam(`${confBaseName}${pos}`)))
}

// Motors class contains all functions to control the steering and driving
class Motors {

  // Motor commands are assuming positiv=driving_forward, negative=driving_backwards.
  // The driving direction of the left side has to be inverted for this to apply to all wheels.
  wheelDirections = [-1, 1, -1, 1, -1, 1]

  async init(motorNode) {

    // Get settings for driving & steering servo
    this.settings = {
      drive: {
        pin: await getServoSettingsArray('pin_drive_', motorNode),
        min: await getServoSettingsArray('steer_pwm_min', motorNode),
        neutral: await getServoSettingsArray('steer_pwm_neutral_', motorNode),
        max: await getServoSettingsArray('steer_pwm_max', motorNode)
      },
      steer: {
        pin: await getServoSettingsArray('pin_steer_', motorNode),
        min: await getServoSettingsArray('drive_pwm_min_', motorNode),
        neutral: await getServoSettingsArray('drive_pwm_neutral_', motorNode),
        max: await getServoSettingsArray('drive_pwm_max_', motorNode)
      }
    }

    this.pwm = await asyncPca9685()

    // Set steering motors to neutral values (straight)
    await Promise.all(positionNames.map(async(_, key) => {
      this.pwm.setPulseRange(
        this.settings.steer.pins[key],
        0,
        this.settings.steer.neutral[key]
      )
      await sleep(100) // TODO: needed ?
    }))

    await this.wiggle()
  }

  async wiggle() {
    let { steer: steerSettings } = this.settings

    await sleep(100)
    this.pwm.setPulseRange(
      steerSettings.pins[0],
      0,
      steerSettings.neutral[0] + ((steerSettings.max[0] - steerSettings.neutral[0]) * 0.5)
    )
    await sleep(100)
    this.pwm.setPulseRange(
      steerSettings.pins[1],
      0,
      steerSettings.neutral[10] + ((steerSettings.max[1] - steerSettings.neutral[1]) * 0.5)
    )
    await sleep(500)
    this.pwm.setPulseRange(
      steerSettings.pins[0],
      0,
      steerSettings.neutral[0] - ((steerSettings.neutral[0] - steerSettings.min[0]) * 0.5)
    )
    await sleep(100)
    this.pwm.setPulseRange(
      steerSettings.pins[1],
      0,
      steerSettings.neutral[0] - ((steerSettings.neutral[1] - steerSettings.min[1]) * 0.5)
    )
    await sleep(300)
    this.pwm.setPulseRange(
      steerSettings.pins[0],
      0,
      steerSettings.neutral[0]
    )
    await sleep(100)
    this.pwm.setPulseRange(
      steerSettings.pins[1],
      0,
      steerSettings.neutral[0]
    )
    await sleep(300)
  }

  setSteering(steeringCommand) {

    let { steer: steerSettings } = this.settings

    for (const key in positionNames) {

      let range = steeringCommand[key] > 0
        ? (steerSettings.max[key] - steerSettings.neutral[key])
        : (steerSettings.neutral[key] - steerSettings.min[key])

      let dutyCycle = parseInt(
        steerSettings.neutral[key]
        + steeringCommand[key] / 90
        * range
      )

      this.pwm.setPulseRange(steerSettings.pins[key], 0, dutyCycle)
    }
  }

  setDriving(drivingCommand) {

    let { drive: driveSettings } = this.settings

    for (const key in positionNames) {

      // Get the range between neutral & max when drivingCommand is pos for regular direction
      // or when drivingCommand is neg for inverted direction
      let hightRange = (driveSettings[key] > 0 && this.wheelDirections[key] === 1)
        || (driveSettings[key] < 0 && this.wheelDirections[key] === -1)

      let range = hightRange
        ? driveSettings.max[key] - driveSettings.neutral[key]
        : (driveSettings.neutral[key] - driveSettings.min[key])

      let dutyCycle = parseInt(
        driveSettings.neutral[key]
        + drivingCommand[key] / 100
        * range
        * this.wheelDirections[key]
      )

      this.pwm.setPulseRange(driveSettings.pins[key], 0, dutyCycle)
    }
  }

  // Set driving wheels to neutral position to stop them
  stopMotors() {
    let { drive: driveSettings } = this.settings

    for (const key in positionNames) {
      this.pwm.setPulseRange(driveSettings.pins[key], 0, driveSettings.neutral[key])
    }
  }
}

module.exports = Motors
