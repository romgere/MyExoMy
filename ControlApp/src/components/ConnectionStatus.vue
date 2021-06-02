<template>
  <span class="cnx-status" :class="statusClass">
     {{ status }}
  </span>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import ros from '../utils/ros'

enum ConnectionStatuses {
  Disconnected = 'disconnected',
  Connected = 'connected',
  Error = 'error',
  Closed = 'closed'
}

export default class ConnectionStatus extends Vue {

  status: ConnectionStatuses = ConnectionStatuses.Disconnected

  get statusClass(): string {
    return `cnx-status--${this.status}`
  }

  constructor() {
    super(...arguments)
    ros.on('connection', () => {
      this.status = ConnectionStatuses.Connected
    })
    ros.on('error', (error) => {
      this.status = ConnectionStatuses.Error
      console.error(error)
    })
    ros.on('close', () => {
      this.status = ConnectionStatuses.Closed
    })
  }
}
</script>

<style scoped lang="scss">
.cnx-status {
  padding: 0.2rem 0.5rem;
  border-radius: 2rem;

  background-color: white;
  color: gray;
  font-weight: bold;
  text-transform: capitalize;

  &::after {
    content: ' ';
    width: 1.5rem;
    height: 1.5rem;
    display: inline-block;
    border-radius: 0.75rem;
    position: relative;
    top: 0.25rem;
    left: 0.25rem;
  }

  &--disconnected::after {
    background-color: orange;
  }

  &--connected::after {
    background-color: green;
  }

  &--error::after {
    background-color: red;
  }

  &--closed::after {
    background-color: rebeccapurple;
  }
}
</style>
