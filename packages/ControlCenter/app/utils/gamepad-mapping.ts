import type { JoysticksMapping, ButtonsMapping } from '@robot/control-center/services/gamepad';

export const joystickMapping: JoysticksMapping = {
  mac: {
    leftStick: [
      { type: 'axe', index: 0 },
      { type: 'axe', index: 1 },
    ],
    rightStick: [
      { type: 'axe', index: 2 },
      { type: 'axe', index: 3 },
    ],
    trigger: [
      { type: 'button', index: 6 },
      { type: 'button', index: 7 },
    ],
  },
  ubuntu: {
    leftStick: [
      { type: 'axe', index: 0 },
      { type: 'axe', index: 1 },
    ],
    rightStick: [
      { type: 'axe', index: 2 },
      { type: 'axe', index: 3 },
    ],
    trigger: [
      { type: 'button', index: 6 },
      { type: 'button', index: 7 },
    ],
  },
};

export const buttonMapping: ButtonsMapping = {
  mac: {
    cross: 0,
    square: 2,
    circle: 1,
    triangle: 3,

    share: 8,
    option: 9,

    leftStick: 10,
    rightStick: 11,

    r1: 5,
    r2: 7,
    l1: 4,
    l2: 6,

    up: 12,
    down: 13,
    right: 15,
    left: 14,

    psButton: 16,
    pad: 17,
  },
  ubuntu: {
    cross: 0,
    square: 2,
    circle: 1,
    triangle: 3,

    share: 8,
    option: 9,

    leftStick: 10,
    rightStick: 11,

    r1: 5,
    r2: 7,
    l1: 4,
    l2: 6,

    up: 12,
    down: 13,
    right: 15,
    left: 14,

    psButton: 16,
    pad: 17,
  },
};
