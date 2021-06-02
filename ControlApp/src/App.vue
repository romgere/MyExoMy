<template>
  <Main />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import Main from './components/Main.vue'
import ROSLIB from 'roslib'
import ros from './utils/ros'

interface TypedMessage<T> extends ROSLIB.Message {
  data: T
}

@Options({
  components: {
    Main
  }
})
export default class App extends Vue {
  constructor() {
    super(...arguments)

    // Romgere tests
    // Communication test with node.js ROS node
    const nodeJsChatter = new ROSLIB.Topic({
      ros,
      name: '/chatter',
      messageType: 'std_msgs/String'
    })
    nodeJsChatter.subscribe(function (m) {
      const { data } = (m as TypedMessage<string>)
      console.log('chatter', data)
    })

    // Communication test with node.js ROS node
    const gpioChatter = new ROSLIB.Topic({
      ros,
      name: '/gpio',
      messageType: 'std_msgs/String'
    })
    gpioChatter.subscribe(function (m) {
      const { data } = (m as TypedMessage<string>)
      // var btn = document.getElementById("btn")
      // btn.innerHTML = data;
      // btn.style.backgroundColor = data === 'ON' ? 'green' : 'red';
      console.log('gpio', data)
    })
  }
}
</script>
