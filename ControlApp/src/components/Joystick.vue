<template>
  <div id="joy_container"></div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import nipplejs from 'nipplejs'
import joystickUtils, { AxesValue } from '../utils/joystick'

const maxDistance = 75

export default class Joystick extends Vue {
  private options: nipplejs.JoystickManagerOptions = {
    threshold: 0.1,
    position: { left: '50%', bottom: '10rem' },
    mode: 'static',
    size: 150,
    color: 'black'
  }

  private manager!: nipplejs.JoystickManager

  mounted () : void {
    this.manager = nipplejs.create({
      ...this.options,
      zone: document.getElementById('joy_container') as HTMLElement
    })

    this.manager.on('move', this.onJoyMove.bind(this))
    this.manager.on('end', this.onJoyEnd.bind(this))
  }

  onJoyMove (event: nipplejs.EventData, nipple: nipplejs.JoystickOutputData): void {
    const x = -Math.cos(nipple.angle.radian) * nipple.distance / maxDistance
    const y = Math.sin(nipple.angle.radian) * nipple.distance / maxDistance

    const axes: AxesValue = [x, y, 0, 0, 0, 0]

    joystickUtils.moveAxes(axes)
  }

  onJoyEnd(): void {
    joystickUtils.moveAxes([0, 0, 0, 0, 0, 0], true)
    console.log('End function called')
  }

}
</script>
