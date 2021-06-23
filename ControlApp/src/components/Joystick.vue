<template>
  <div id="joy_container"></div>
</template>

<script>
import { Vue } from 'vue-class-component'
import nipplejs from 'nipplejs'
import joystickUtils from '../utils/joystick'

const maxDistance = 75

export default class Joystick extends Vue {
  _options = {
    threshold: 0.1,
    position: { left: '50%', bottom: '10rem' },
    mode: 'static',
    size: 150,
    color: 'black'
  }

  _manager = undefined

  mounted() {
    this._manager = nipplejs.create({
      ...this._options,
      zone: document.getElementById('joy_container')
    })

    this._manager.on('move', this.onJoyMove.bind(this))
    this._manager.on('end', this.onJoyEnd.bind(this))
  }

  onJoyMove(event, nipple) {
    const x = -Math.cos(nipple.angle.radian) * nipple.distance / maxDistance
    const y = Math.sin(nipple.angle.radian) * nipple.distance / maxDistance

    const axes = [x, y, 0, 0, 0, 0]

    joystickUtils.moveAxes(axes)
  }

  onJoyEnd() {
    joystickUtils.moveAxes([0, 0, 0, 0, 0, 0], true)
    console.log('End function called')
  }
}
</script>
