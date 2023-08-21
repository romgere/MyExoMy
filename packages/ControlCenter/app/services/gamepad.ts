import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import EventEmitter from 'eventemitter3';
import { joystickMapping, buttonMapping } from '@robot/control-center/utils/gamepad-mapping';

interface EventTypes {
  joyMove: (axes: PS4ContollerAxes) => void;
  joyEnd: () => void;
  buttonChange: (buttons: PS4ContollerButtons) => void;
}

export type PS4ContollerButtons = {
  cross: boolean;
  square: boolean;
  circle: boolean;
  triangle: boolean;

  share: boolean;
  option: boolean;

  leftStick: boolean;
  rightStick: boolean;

  r1: boolean;
  r2: boolean;
  l1: boolean;
  l2: boolean;

  up: boolean;
  down: boolean;
  right: boolean;
  left: boolean;

  psButton: boolean;
  pad: boolean;
};

export type PS4ContollerAxes = {
  leftStick: [number, number];
  rightStick: [number, number];
  trigger: [number, number]; // [L2, R2]
};

const emptyPS4ContollerButtons = {
  cross: false,
  square: false,
  circle: false,
  triangle: false,

  share: false,
  option: false,

  leftStick: false,
  rightStick: false,

  r1: false,
  r2: false,
  l1: false,
  l2: false,

  up: false,
  down: false,
  right: false,
  left: false,

  psButton: false,
  pad: false,
};

const emptyPS4ContollerAxes: PS4ContollerAxes = {
  leftStick: [0, 0],
  rightStick: [0, 0],
  trigger: [0, 0],
};

type OS = 'mac' | 'ubuntu';
type AxeMapping = { type: 'axe' | 'button'; index: number };

type JoystickMapping = Record<keyof PS4ContollerAxes, [AxeMapping, AxeMapping]>;
type ButtonMapping = Record<keyof PS4ContollerButtons, number>;

export type JoysticksMapping = Record<OS, JoystickMapping>;
export type ButtonsMapping = Record<OS, ButtonMapping>;

const axeThreshold = 0.1; // Minimal move from origin to consider as a Joystick move.
const axeSensitivity = 0.05; // Minimal move (from previous value) to consider a move to send as "joyMove" event.

export default class GamepadService extends Service {
  eventEmitter: EventEmitter<EventTypes, GamepadService> = new EventEmitter<
    EventTypes,
    GamepadService
  >();

  @tracked
  gamepadConnected = false;

  os: OS = 'mac';
  axes: PS4ContollerAxes = { ...emptyPS4ContollerAxes };
  buttons: PS4ContollerButtons = { ...emptyPS4ContollerButtons };

  // Proxy on/off method
  on = this.eventEmitter.on.bind(this.eventEmitter) as (typeof this.eventEmitter)['on'];
  off = this.eventEmitter.off.bind(this.eventEmitter) as (typeof this.eventEmitter)['off'];

  get buttonsMapping(): ButtonMapping {
    return buttonMapping[this.os];
  }

  get joysticksMapping(): JoystickMapping {
    return joystickMapping[this.os];
  }

  constructor(...args: ConstructorParameters<typeof Service>) {
    super(...args);

    window.addEventListener('gamepadconnected', () => {
      this.gamepadConnected = true;
      this.gameLoop();
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
    });
  }

  // "Convert" raw gamepad buttons array to PS4 controller buttons
  getButtonState(buttons: readonly GamepadButton[]): PS4ContollerButtons {
    const { buttonsMapping } = this;
    const ps4Buttons = {
      ...emptyPS4ContollerButtons,
    };

    for (const [key, index] of Object.entries(buttonsMapping)) {
      ps4Buttons[key as keyof PS4ContollerButtons] = buttons[index].pressed;
    }

    return ps4Buttons;
  }

  // "Convert" raw gamepad axes/buttons array to PS4 controller axes
  getAxesState(axes: readonly number[], buttons: readonly GamepadButton[]): PS4ContollerAxes {
    const { joysticksMapping } = this;
    const ps4Axes: PS4ContollerAxes = {
      ...emptyPS4ContollerAxes,
    };

    for (const [key, mappings] of Object.entries(joysticksMapping)) {
      ps4Axes[key as keyof PS4ContollerAxes] = [
        this.getMappedAxeValue(mappings[0], axes, buttons),
        this.getMappedAxeValue(mappings[1], axes, buttons),
      ];
    }

    return ps4Axes;
  }

  getMappedAxeValue(
    mapping: AxeMapping,
    axes: readonly number[],
    buttons: readonly GamepadButton[],
  ): number {
    let value = 0;

    if (mapping.type === 'button') {
      value = buttons[mapping.index].value;
    } else if (mapping.type === 'axe') {
      value = axes[mapping.index];
    }

    return Math.abs(value) < axeThreshold ? 0 : value;
  }

  @action
  handleButtonEvent(buttons: readonly GamepadButton[]) {
    const ps4Buttons = this.getButtonState(buttons);

    for (const idx in ps4Buttons) {
      if (
        ps4Buttons[idx as keyof PS4ContollerButtons] !==
        this.buttons?.[idx as keyof PS4ContollerButtons]
      ) {
        this.buttons = ps4Buttons;
        this.eventEmitter.emit('buttonChange', ps4Buttons);
        return;
      }
    }
  }

  areAxesIdle(axes: PS4ContollerAxes) {
    for (const values of Object.values(axes)) {
      if (values[0] || values[1]) {
        return false;
      }
    }
    return true;
  }

  @action
  handleJoystickEvent(axes: readonly number[], buttons: readonly GamepadButton[]) {
    const ps4Axes = this.getAxesState(axes, buttons);

    // IF all axe are
    const allIdle = this.areAxesIdle(ps4Axes);
    const previousAllIdle = this.areAxesIdle(this.axes);

    // Nothing to do
    if (allIdle && previousAllIdle) {
      return;
    } else if (allIdle && !previousAllIdle) {
      this.axes = ps4Axes;
      this.eventEmitter.emit('joyEnd');
    } else {
      // Check if diff from previous is > to axeSensitivity & trigger new "joyMove" event if needed
      for (const [key, axe] of Object.entries(ps4Axes)) {
        const diffX = Math.abs(1 + this.axes[key as keyof PS4ContollerAxes][0] - (1 + axe[0]));
        const diffY = Math.abs(1 + this.axes[key as keyof PS4ContollerAxes][1] - (1 + axe[1]));

        if (diffX > axeSensitivity || diffY > axeSensitivity) {
          this.eventEmitter.emit('joyMove', ps4Axes);
          this.axes = ps4Axes;
        }
      }
    }
  }

  emitJoyMoveEvent() {}

  @action
  gameLoop() {
    const gamepads = navigator.getGamepads();
    if (!gamepads || !this.gamepadConnected) {
      this.gamepadConnected = false;
      return;
    }

    const gp = gamepads[0];

    if (!gp) {
      return;
    }

    // First loop
    if (!this.axes) {
      this.axes = this.getAxesState(gp.axes, gp.buttons);
    }
    if (!this.buttons) {
      this.buttons = this.getButtonState(gp.buttons);
    }

    this.handleJoystickEvent(gp.axes, gp.buttons);
    this.handleButtonEvent(gp.buttons);

    requestAnimationFrame(this.gameLoop);
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    gamepad: GamepadService;
  }
}
