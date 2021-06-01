import ROSLIB from 'roslib'

const { hostname } = window.location

export default new ROSLIB.Ros({
  url: 'ws://' + hostname + ':9090'
})
