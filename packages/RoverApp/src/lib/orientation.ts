// Inspired by https://gist.github.com/srlm-io/fafee8feed8bd5661266#file-orientation-cpp-L3
import type { Coord3D, RoverOrientation } from '@robot/shared/types.js';
import { OrientationConfig } from '../types.js';
const { atan2, atan, sin, cos } = Math;

function degrees(radians: number) {
  return radians * (180 / Math.PI);
}

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
  private orientationConfig: OrientationConfig;

  constructor(config: OrientationConfig) {
    this.orientationConfig = config;
  }

  calculate(accl: Coord3D, magn: Coord3D): RoverOrientation {
    const accl_x = accl.x;
    const accl_y = accl.y;
    const accl_z = accl.z;

    // Freescale solution
    let roll = atan2(accl_y, accl_z);
    let pitch = atan(-accl_x / (accl_y * sin(roll) + accl_z * cos(roll)));

    roll =
      degrees(roll) * (this.orientationConfig.inverseRoll ? -1 : 1) +
      this.orientationConfig.deviationRoll;
    pitch =
      degrees(pitch) * (this.orientationConfig.inversePitch ? -1 : 1) +
      this.orientationConfig.deviationPitch;
    // yaw = degrees(yaw) * (this.orientationConfig.inverseYaw ? -1 : 1);

    const cx = magn.x - this.orientationConfig.hardironX;
    const cy = magn.y - this.orientationConfig.hardironY;
    // const cz = magn.z - this.orientationConfig.hardironY;

    // now compute heading
    let heading = (atan2(cy, cx) * 180.0) / Math.PI;
    heading = heading + this.orientationConfig.deviationHeading;
    if (heading < 0) heading += 360;
    else if (heading > 360) heading -= 360;

    return {
      roll: Math.round(roll),
      pitch: Math.round(pitch),
      heading: Math.round(heading),
    };
  }
}
