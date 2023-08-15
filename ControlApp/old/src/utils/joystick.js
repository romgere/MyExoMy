import ROSLIB from 'roslib'
import ros from './ros'

class JoystickUtils {
  axes = [0, 0, 0, 0, 0, 0]
  buttons = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  joyTopic = undefined

  publishImmidiately = true
  intervalId = undefined

  constructor() {
    this.joyTopic = new ROSLIB.Topic({
      ros,
      name: '/joy',
      messageType: 'sensor_msgs/Joy'
    })
  }

  moveAxes(axesValue, moveEnd = false) {
    this.axes = axesValue

    if (moveEnd) {
      window.clearInterval(this.intervalId)
      this._sendJoyEvent()
    } else if (this.publishImmidiately) {
      // TODO: refactor this with a debounce lib ?
      this.publishImmidiately = false
      this._sendJoyEvent()
      window.clearInterval(this.intervalId)

      this.intervalId = window.setInterval(this._sendJoyEvent.bind(this), 50)

      setTimeout(() => {
        this.publishImmidiately = true
      }, 50)
    }
  }

  pressButton(buttonIndex) {
    // Set axes to 0 to prevent driving during mode change.
    this.axes = [0, 0, 0, 0, 0, 0]
    this.buttons[buttonIndex] = 1

    this._sendJoyEvent()
    // After the command is sent set the index back to 0
    this.buttons[buttonIndex] = 0
  }

  _sendJoyEvent() {
    const joy = new ROSLIB.Message({
      axes: this.axes,
      buttons: this.buttons
    })
    this.joyTopic.publish(joy)

    console.log(this.axes)
    console.log(this.buttons)
  }
}

export default new JoystickUtils()
