import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import { debounce } from '@ember/runloop';
import nipplejs from 'nipplejs';
import { action } from '@ember/object';

import type {
  JoystickManager,
  JoystickManagerOptions,
  EventData,
  JoystickOutputData,
} from 'nipplejs';

interface VirtualJoystickArgs {
  debounceDelay?: number;
  onJoyMove: (data: [number, number]) => void;
  onJoyEnd: () => void;
}

const maxDistance = 75;

export default class VirtualJoystick extends Component<VirtualJoystickArgs> {
  axes: [number, number] = [0, 0];
  manager?: JoystickManager;

  nippleOptions: JoystickManagerOptions = {
    threshold: 0.1,
    position: { left: '50%', bottom: '10rem' },
    mode: 'static',
    size: 150,
    color: 'black',
  };

  get debounceDelay() {
    return this.args?.debounceDelay ?? 50;
  }

  mountNipple = modifier((element: HTMLDivElement) => {
    this.manager = nipplejs.create({
      ...this.nippleOptions,
      zone: element,
    });

    this.manager.on('move', this.onJoyMove.bind(this));
    this.manager.on('end', this.onJoyEnd.bind(this));
  });

  @action
  onJoyMove(_: EventData, nipple: JoystickOutputData) {
    const x = -(Math.cos(nipple.angle.radian) * nipple.distance) / maxDistance;
    const y = (Math.sin(nipple.angle.radian) * nipple.distance) / maxDistance;

    this.axes = [x, y];

    debounce(this, this.sendJoyMoveEvent, this.debounceDelay);
  }

  @action
  onJoyEnd() {
    this.axes = [0, 0];
    debounce(this, this.sendJoyMoveEvent, this.debounceDelay, true);
    this.args.onJoyEnd();
  }

  @action
  sendJoyMoveEvent() {
    this.args.onJoyMove(this.axes);
  }
}
