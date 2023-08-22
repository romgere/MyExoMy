import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import nipplejs from 'nipplejs';
import { action } from '@ember/object';
import { debounce } from '@ember/runloop';

import type {
  JoystickManager,
  JoystickManagerOptions,
  EventData,
  JoystickOutputData,
} from 'nipplejs';

interface VirtualJoystickArgs {
  onJoyMove: (data: [number, number]) => void;
  onJoyEnd: () => void;
}

const maxDistance = 75;

export default class VirtualJoystick extends Component<VirtualJoystickArgs> {
  axes: [number, number] = [0, 0];
  manager?: JoystickManager;

  nippleOptions: JoystickManagerOptions = {
    threshold: 0.1,
    position: { left: '50%', top: '90%' },
    mode: 'static',
    size: 150,
    color: 'black',
  };

  zone?: HTMLDivElement;

  mountNipple = modifier((element: HTMLDivElement) => {
    this.zone = element;
    // Delay the creation of joystick to ensure flex element has been sized when joystick "calculate size/position stuff"
    setTimeout(this.createNipple, 100);
  });

  @action
  createNipple() {
    if (!this.zone) {
      return;
    }

    this.manager = nipplejs.create({
      ...this.nippleOptions,
      zone: this.zone,
    });

    this.manager.on('move', this.onJoyMove.bind(this));
    this.manager.on('end', this.onJoyEnd.bind(this));
  }

  @action
  onJoyMove(_: EventData, nipple: JoystickOutputData) {
    const x = -(Math.cos(nipple.angle.radian) * nipple.distance) / maxDistance;
    const y = (Math.sin(nipple.angle.radian) * nipple.distance) / maxDistance;

    this.args.onJoyMove([x, y]);
  }

  @action
  onJoyEnd() {
    this.args.onJoyMove([0, 0]);
    this.args.onJoyEnd();
  }

  @action
  handleResize() {
    this.manager?.destroy();
    debounce(this.createNipple, 100);
  }
}
