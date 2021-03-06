#!/usr/bin/env node
'use strict'

const { Gpio } = require('onoff')
const button = new Gpio(4, 'in', 'both', { debounceTimeout: 10 })

// Require rosnodejs itself
const rosnodejs = require('rosnodejs')
// Requires the std_msgs message package
const std_msgs = rosnodejs.require('std_msgs').msg // eslint-disable-line camelcase

function listener() {
  // Register node with ROS master
  rosnodejs.initNode('/gpio')
    .then((rosNode) => {
      const pub = rosNode.advertise('/gpio', std_msgs.String)

      button.watch((err, value) => {
        if (err) {
          throw err
        }

        const msg = new std_msgs.String()
        msg.data = value === 1 ? 'ON' : 'OFF'
        pub.publish(msg)
      })
    })

  process.on('SIGINT', () => {
    button.unexport()
  })
}

if (require.main === module) {
  // Invoke Main Listener Function
  listener()
}
