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
      { type: 'axe', index: 4, normalizeToInt: true },
      { type: 'axe', index: 5, normalizeToInt: true },
    ],
  },
};

export const buttonMapping: ButtonsMapping = {
  mac: {
    cross: { type: 'button', index: 0 },
    square: { type: 'button', index: 2 },
    circle: { type: 'button', index: 1 },
    triangle: { type: 'button', index: 3 },

    share: { type: 'button', index: 8 },
    option: { type: 'button', index: 9 },

    leftStick: { type: 'button', index: 10 },
    rightStick: { type: 'button', index: 11 },

    r1: { type: 'button', index: 5 },
    r2: { type: 'button', index: 7 },
    l1: { type: 'button', index: 4 },
    l2: { type: 'button', index: 6 },

    up: { type: 'button', index: 12 },
    down: { type: 'button', index: 13 },
    right: { type: 'button', index: 15 },
    left: { type: 'button', index: 14 },

    psButton: { type: 'button', index: 16 },
    pad: { type: 'button', index: 17 },
  },
  ubuntu: {
    cross: { type: 'button', index: 0 },
    square: { type: 'button', index: 3 },
    circle: { type: 'button', index: 1 },
    triangle: { type: 'button', index: 2 },

    share: { type: 'button', index: 8 },
    option: { type: 'button', index: 9 },

    leftStick: { type: 'button', index: 11 },
    rightStick: { type: 'button', index: 12 },

    r1: { type: 'button', index: 5 },
    r2: { type: 'button', index: 7 },
    l1: { type: 'button', index: 4 },
    l2: { type: 'button', index: 6 },

    up: { type: 'axe', index: 7, pressedOn: -1 },
    down: { type: 'axe', index: 7, pressedOn: 1 },
    right: { type: 'axe', index: 6, pressedOn: 1 },
    left: { type: 'axe', index: 6, pressedOn: -1 },

    psButton: { type: 'button', index: 10 },
    pad: undefined,
  },
};
