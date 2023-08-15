/*
  This script helps to test the functionality of the Raspberry Pi camera.
  The script must be run dicrectly on the Raspberry Pi (not in the Docker container)
*/
const fs = require('fs-extra')
const PiCamera = require('pi-camera')

const folder = '/home/pi/Videos/'
const file = 'exomy-video-test.h264'

if (!fs.existsSync(folder)) {
  console.log(`"${folder}" does not exits.`)
  console.log('The script must be run dicrectly on the Raspberry Pi')
  process.exit(1)
}

const camera = new PiCamera({
  mode: 'video',
  output: `${folder}${file}`,
  width: 1920,
  height: 1080,
  timeout: 5000, // Record for 5 seconds
  nopreview: true
})

camera
  .record()
  .then(() => {
    console.log('Video recorded !')
    console.log(`Check into "${folder}" folder for a "${file}" file`)
  })
  .catch((error) => {
    console.log('Error while recording video.', error)
  })
