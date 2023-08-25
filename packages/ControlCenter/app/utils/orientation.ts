// Inspired by https://gist.github.com/srlm-io/fafee8feed8bd5661266#file-orientation-cpp-L3
import { Coord3D } from '@robot/shared/types';
const { atan2, atan, sin, cos } = Math;

function degrees(radians: number) {
  return radians * (180 / Math.PI);
}

// https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml
// "2023-08-25	1° 39' E  +/- 0° 22'  changing by  0° 11' E per year" => +1
const default_declination = 0;

// Boat
const default_hardiron_x = 8.019;
const default_hardiron_y = -48.538;
const default_hardiron_z = -14.956;

export type Orientation = {
  roll: number;
  pitch: number;
  yaw: number;
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
  declination: number;
  hardiron_x: number;
  hardiron_y: number;
  hardiron_z: number;

  // Tweak this depending on gyro/magnetometer sensor orientation inside rover body
  inversePitch = true;
  inverseRoll = true;
  inverseYaw = false;
  headingShift = 120; // Why 120 degree !? shouldn't it be multiple of 90 ?

  constructor(
    declination: number = default_declination,
    hardiron_x: number = default_hardiron_x,
    hardiron_y: number = default_hardiron_y,
    hardiron_z: number = default_hardiron_z,
  ) {
    this.declination = declination;
    this.hardiron_x = hardiron_x;
    this.hardiron_y = hardiron_y;
    this.hardiron_z = hardiron_z;
  }

  calculate(accl: Coord3D, magn: Coord3D): Orientation {
    // Signs choosen so that, when axis is down, the value is + 1g
    const accl_x = accl.x;
    const accl_y = accl.y;
    const accl_z = accl.z;

    // Freescale solution
    let roll = atan2(accl_y, accl_z);
    let pitch = atan(-accl_x / (accl_y * sin(roll) + accl_z * cos(roll)));

    // -magn.x because magnetometer X axe is inverted compared to gyro ?
    const magn_x = -magn.x - this.hardiron_x;
    const magn_y = magn.y - this.hardiron_y;
    const magn_z = magn.z - this.hardiron_z;

    const magn_fy_fs = magn_z * sin(roll) - magn_y * cos(roll);
    const magn_fx_fs =
      magn_x * cos(pitch) + magn_y * sin(pitch) * sin(roll) + magn_z * sin(pitch) * cos(roll);

    let yaw = atan2(magn_fy_fs, magn_fx_fs);

    roll = degrees(roll) * (this.inverseRoll ? -1 : 1);
    pitch = degrees(pitch) * (this.inversePitch ? -1 : 1);
    yaw = degrees(yaw) * (this.inverseYaw ? -1 : 1);

    const heading = this.yawToHeading(yaw);

    return {
      roll: roll,
      pitch: pitch,
      yaw: yaw,
      heading: heading,
    };
  }

  yawToHeading(yaw: number) {
    let heading = yaw + this.declination + this.headingShift;

    if (heading < 0.0) {
      heading += 360.0;
    } else if (heading > 360.0) {
      heading -= 360.0;
    }

    return heading;
  }
}
