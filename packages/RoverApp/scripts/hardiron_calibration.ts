// https://gist.github.com/srlm-io/fafee8feed8bd5661266#file-hardironcalibration-ino
import GyroscopeSensor from '@robot/rover-app/lib/sensors/gyroscope.js';
import MagnetometerSensor from '@robot/rover-app/lib/sensors/magnetometer.js';

const gyro = new GyroscopeSensor();
const magneto = new MagnetometerSensor();
await magneto.setContinuousMode(true);
await magneto.setDataRate(255);

let lastDisplayTime = 0;
let AccelMinX = 0,
  AccelMaxX = 0;
let AccelMinY = 0,
  AccelMaxY = 0;
let AccelMinZ = 0,
  AccelMaxZ = 0;
let MagMinX = 0,
  MagMaxX = 0;
let MagMinY = 0,
  MagMaxY = 0;
let MagMinZ = 0,
  MagMaxZ = 0;

async function main() {
  while (true) {
    const gyroData = await gyro.getAccelerometerValues();
    const magnetoData = await magneto.getEvent();

    if (gyroData.x < AccelMinX) AccelMinX = gyroData.x;
    if (gyroData.x > AccelMaxX) AccelMaxX = gyroData.x;

    if (gyroData.y < AccelMinY) AccelMinY = gyroData.y;
    if (gyroData.y > AccelMaxY) AccelMaxY = gyroData.y;

    if (gyroData.z < AccelMinZ) AccelMinZ = gyroData.z;
    if (gyroData.z > AccelMaxZ) AccelMaxZ = gyroData.z;

    if (magnetoData.x < MagMinX) MagMinX = magnetoData.x;
    if (magnetoData.x > MagMaxX) MagMaxX = magnetoData.x;

    if (magnetoData.y < MagMinY) MagMinY = magnetoData.y;
    if (magnetoData.y > MagMaxY) MagMaxY = magnetoData.y;

    if (magnetoData.z < MagMinZ) MagMinZ = magnetoData.z;
    if (magnetoData.z > MagMaxZ) MagMaxZ = magnetoData.z;

    // display once/second
    const time = new Date().getTime();
    if (time - lastDisplayTime > 1000) {
      const hardiron_x = (MagMaxX + MagMinX) / 2;
      const hardiron_y = (MagMaxY + MagMinY) / 2;
      const hardiron_z = (MagMaxZ + MagMinZ) / 2;

      console.log('hardiron_x:', hardiron_x.toFixed(3));
      console.log('hardiron_y:', hardiron_y.toFixed(3));
      console.log('hardiron_z:', hardiron_z.toFixed(3));
      console.log('=========================================');

      lastDisplayTime = time;
    }
  }
}

await main();
