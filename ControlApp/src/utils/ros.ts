import ROSLIB from 'roslib'

import conf from './conf'
const { hostname } = conf

export default new ROSLIB.Ros({
  url: 'ws://' + hostname + ':9090'
})
