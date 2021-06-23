<template>
  <button class="button" :class="buttonClass" v-on:click="sendButtonEvent">
    <slot></slot>
  </button>
</template>

<script>
import { Options, Vue } from 'vue-class-component'
import joystickUtils from '../utils/joystick'

const typeMapping = {
  y: 3,
  x: 0,
  a: 1,
  start: 9
}

@Options({
  props: {
    type: undefined
  }
})
export default class Joystick extends Vue {

  type

  get buttonClass() {
    return `button--${this.type}`
  }

  sendButtonEvent() {
    if (!this.type) {
      return
    }

    joystickUtils.pressButton(typeMapping[this.type])
  }
}
</script>

<style scoped lang="scss">
.button {
  border: none;
  color: white;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;

  min-width: 15rem;
  padding: 0.5rem;

  &--y{
    background-color: orange;
  }
  &--x{
    background-color: blue;
  }
  &--a{
    background-color: green;
  }
  &--start{
    background-color: red;
  }

  &:hover, &:focus {
    text-decoration: underline;
  }
}
</style>
