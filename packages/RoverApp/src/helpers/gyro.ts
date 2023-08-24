import { degrees } from './math.js';

function get_distance(a: number, b: number) {
  return Math.sqrt(a * a + b * b);
}

export function getGyroY(x: number, y: number, z: number) {
  const radians = Math.atan2(x, get_distance(y, z));
  return Math.floor(-degrees(radians));
}

export function getGyroX(x: number, y: number, z: number) {
  const radians = Math.atan2(y, get_distance(x, z));
  return Math.floor(degrees(radians));
}

export function getGyroZ(x: number, y: number, z: number) {
  const radians = Math.atan2(z, get_distance(x, y));
  return Math.floor(degrees(radians));
}
