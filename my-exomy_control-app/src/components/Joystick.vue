<template>
  <div class="joy_container" id="joy_container"></div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import ROSLIB from 'roslib'
import ros from '../utils/ros'
import nipplejs from 'nipplejs'

const maxDistance = 75

export default class Joystick extends Vue {
  private options: nipplejs.JoystickManagerOptions = {
    threshold: 0.1,
    position: { left: '50%', top: '50%' },
    mode: 'static',
    size: 150,
    color: 'black'
  }

  private manager!: nipplejs.JoystickManager

  private axes = [0, 0, 0, 0, 0, 0]
  private buttons = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  private publishImmidiately = true
  private intervalId?: number = undefined

  private joyTopic: ROSLIB.Topic

  constructor () {
    super(...arguments)
    this.joyTopic = new ROSLIB.Topic({
      ros: ros,
      name: '/joy',
      messageType: 'sensor_msgs/Joy'
    })
  }

  mounted () : void {
    this.manager = nipplejs.create({
      ...this.options,
      zone: document.getElementById('joy_container') as HTMLElement
    })

    this.manager.on('move', this.onJoyMove.bind(this))
    this.manager.on('end', this.onJoyEnd.bind(this))
  }

  onJoyMove (event: nipplejs.EventData, nipple: nipplejs.JoystickOutputData) {
    const x = -Math.cos(nipple.angle.radian) * nipple.distance / maxDistance
    const y = Math.sin(nipple.angle.radian) * nipple.distance / maxDistance

    this.axes = [x, y, 0, 0, 0, 0]

    // nipplejs is triggering events when joystick moves each pixel
    // we need delay between consecutive messege publications to
    // prevent system from being flooded by messages
    // events triggered earlier than 50ms after last publication will be dropped

    if (this.publishImmidiately) {
      this.publishImmidiately = false
      this.sendJoyEvent()
      window.clearInterval(this.intervalId)

      this.intervalId = window.setInterval(this.sendJoyEvent.bind(this), 50)

      setTimeout(() => {
        this.publishImmidiately = true
      }, 50)
    }
  }

  onJoyEnd () {
    window.clearInterval(this.intervalId)
    this.axes = [0, 0, 0, 0, 0, 0]
    this.sendJoyEvent()

    console.log('End function called')
  }

  private sendJoyEvent () {
    var joy = new ROSLIB.Message({
      axes: this.axes,
      buttons: this.buttons
    })
    this.joyTopic.publish(joy)

    console.log(this.axes)
    console.log(this.buttons)
  }
}
</script>

<style scoped lang="scss">
.joy_container {
  height: 100%;
  width: 100%;
}
</style>
