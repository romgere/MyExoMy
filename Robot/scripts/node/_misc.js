const Pca9685Driver = require("pca9685").Pca9685Driver;
const i2cBus = require("i2c-bus");

// For most motors a pwm frequency of 50Hz is normal
const pwmFrequency = 50.0  // Hz

const exomyBigString = `$$$$$$$$\\                     $$\\      $$\\           
$$  _____|                    $$$\\    $$$ |          
$$ |      $$\\   $$\\  $$$$$$\\  $$$$\\  $$$$ |$$\\   $$\\ 
$$$$$\\    \\$$\\ $$  |$$  __$$\\ $$\\$$\\$$ $$ |$$ |  $$ |
$$  __|    \\$$$$  / $$ /  $$ |$$ \\$$$  $$ |$$ |  $$ |
$$ |       $$  $$<  $$ |  $$ |$$ |\\$  /$$ |$$ |  $$ |
$$$$$$$$\\ $$  /\\$$\\ \\$$$$$$  |$$ | \\_/ $$ |\\$$$$$$$ |
\\________|\\__/  \\__| \\______/ \\__|     \\__| \\____$$ |
                                           $$\\   $$ |
                                           \\$$$$$$  |
                                            \\______/ `

const finisedBigString = `$$$$$$$$\\ $$\\           $$\\           $$\\                       $$\\ 
$$  _____|\\__|          \\__|          $$ |                      $$ |
$$ |      $$\\ $$$$$$$\\  $$\\  $$$$$$$\\ $$$$$$$\\   $$$$$$\\   $$$$$$$ |
$$$$$\\    $$ |$$  __$$\\ $$ |$$  _____|$$  __$$\\ $$  __$$\\ $$  __$$ |
$$  __|   $$ |$$ |  $$ |$$ |\\$$$$$$\\  $$ |  $$ |$$$$$$$$ |$$ /  $$ |
$$ |      $$ |$$ |  $$ |$$ | \\____$$\\ $$ |  $$ |$$   ____|$$ |  $$ |
$$ |      $$ |$$ |  $$ |$$ |$$$$$$$  |$$ |  $$ |\\$$$$$$$\\ \\$$$$$$$ |
\\__|      \\__|\\__|  \\__|\\__|\\_______/ \\__|  \\__| \\_______| \\_______|`

module.exports = {
  pwmFrequency,
  exomyBigString,
  finisedBigString,

  sleep(msTime) {
    return new Promise((resolve) => {
      setTimeout(resolve, msTime);
    })
  },

  asyncPca9685(options = {}) {
    return new Promise((resolve, reject) => {
      let pwm = new Pca9685Driver(
        {        
          i2c: i2cBus.openSync(1),
          address: 0x40,
          debug: false,
          frequency: pwmFrequency,
          ...options
        },
        function(err) {
          if (err) {
            reject(err)
          } else{
            resolve(pwm)
          }
        }
      )
    })
  }
}