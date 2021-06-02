<template>
  <img v-bind:src="streamUrl" />
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import conf from '../utils/conf'
const { hostname, videoStreamPort } = conf

export default class VideoOutput extends Vue {

  get streamUrl() :string {
    return `//${hostname}:${videoStreamPort}/stream?topic=/pi_cam/image_raw`
  }
}
</script>
