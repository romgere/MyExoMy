// Inspired by https://gist.github.com/srlm-io/fafee8feed8bd5661266#file-orientation-cpp-L3
import { Coord3D } from '@robot/shared/types';
const { atan2, atan, sin, cos } = Math;

function degrees(radians: number) {
  return radians * (180 / Math.PI);
}

// TODO: Make this a config
const default_hardiron_x = -25.9875;
const default_hardiron_y = -13.75625;
const default_hardiron_z = -5.52812;

export type Orientation = {
  roll: number;
  pitch: number;
  heading: number;
};

/** Use an eCompass algorithm to calculate orientation
 *
 * The algorithm is based on http://cache.freescale.com/files/sensors/doc/app_note/AN4248.pdf
 *
 * Hardiron calibration must be performed. The process is simple:
 *   1. Mount the magnetometer in the location that you intend to use it at
 *   2. Rotate the body through all possible orientations
 *   3. Record the minimum and maximum for each axis of the magnetometer
 *   4. Average the minumum and maximum for each axis. This will give you your hardiron x,y,z offsets.
 */
export default class OrientationHelper {
  // TODO: make this a config
  hardiron_x: number = default_hardiron_x;
  hardiron_y: number = default_hardiron_y;
  hardiron_z: number = default_hardiron_z;

  // TODO: make this a config
  // Tweak this depending on gyro/magnetometer sensor orientation inside rover body
  inversePitch = false;
  inverseRoll = false;
  inverseHeading = false;

  // TODO: make this a config
  // Tweak this if HUD is not centered while rover on plane surface & oriented to magnetic north
  deviationPitch = 0.7;
  deviationRoll = -2;
  deviationHeading = 67;

  calculate(accl: Coord3D, magn: Coord3D): Orientation {
    const accl_x = accl.x;
    const accl_y = accl.y;
    const accl_z = accl.z;

    // Freescale solution
    let roll = atan2(accl_y, accl_z);
    let pitch = atan(-accl_x / (accl_y * sin(roll) + accl_z * cos(roll)));

    roll = degrees(roll) * (this.inverseRoll ? -1 : 1) + this.deviationRoll;
    pitch = degrees(pitch) * (this.inversePitch ? -1 : 1) + this.deviationPitch;
    // yaw = degrees(yaw) * (this.inverseYaw ? -1 : 1);

    const cx = magn.x - this.hardiron_x;
    const cy = magn.y - this.hardiron_y;
    // const cz = magn.z - this.hardiron_y;

    // now compute heading
    let heading = (atan2(cy, cx) * 180.0) / Math.PI;
    heading = heading + this.deviationHeading;
    if (heading < 0) heading += 360;
    else if (heading > 360) heading -= 360;

    return {
      roll: Math.round(roll),
      pitch: Math.round(pitch),
      heading: Math.round(heading),
    };
  }
}
