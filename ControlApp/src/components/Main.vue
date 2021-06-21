<template>
  <VideoOutput class="video_output--full-screen"/>
  <div class="main-container">
    <div class="flex-container">
      <div class="sidebar">
        <label class="video-text">Controls</label>
        <div class="control-container">
          <div class="control-container--btn">
            <Button type="y">CRABBING</Button>
          </div>
          <div class="control-container--btn">
            <Button type="x">SPOT TURN</Button>
          </div>
          <div class="control-container--btn">
            <Button type="a">ACKERMANN</Button>
          </div>
          <div class="control-container--btn">
            <Button type="start">MOTORS</Button>
          </div>
        </div>
      </div>
      <div class="main">
        <div class="connection-status video-text">
          Connection status: <ConnectionStatus />
        </div>
      </div>
    </div>
  </div>
  <Joystick />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import Joystick from './Joystick.vue'
import Button from './Button.vue'
import ConnectionStatus from './ConnectionStatus.vue'
import VideoOutput from './VideoOutput.vue'

@Options({
  props: {
    msg: String
  },
  components: {
    Joystick,
    Button,
    ConnectionStatus,
    VideoOutput
  }
})
export default class HelloWorld extends Vue {
  msg!: string
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.video_output--full-screen {
  width: 100%;
  height: 100%;
  position: absolute;
}

.main-container {
  position: absolute;
  height: 100vh;
  width: 100vw;

  .flex-container {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-content: stretch;
    align-items: flex-start;

    .sidebar {
      order: 0;
      flex: 0 1 auto;
      align-self: auto;

      padding: 1.5rem;

      label {
        display: block;
        font-size: 1.5rem;
        text-align: center;
      }

      .control-container {
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        justify-content: flex-start;
        align-content: stretch;
        align-items: center;

        .control-container--btn {
          order: 0;
          flex: 0 1 auto;
          align-self: auto;
          margin-top: 2rem;
        }
      }
    }

    .main {
      order: 1;
      flex: 1 1 auto;
      align-self: auto;

      padding: 1.5rem;

      .connection-status {
      font-size: 1.5rem;
        text-align: center;
      }
    }
  }
}
</style>
