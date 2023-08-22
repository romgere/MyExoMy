import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';
import HUD from '../utils/simple-hud';

interface HudComponentArgs {}

export default class HudComponent extends Component<HudComponentArgs> {
  hud?: HUD;

  mountHud = modifier((element: HTMLCanvasElement) => {
    this.hud = new HUD(element);
    this.hud.start();
  });
}
