import Component from '@glimmer/component';

interface SensorStatusButtonArgs {
  enable: boolean;
  critical: boolean;
}

export default class SensorStatusButton extends Component<SensorStatusButtonArgs> {
  get enableVariant() {
    return this.args.critical ? 'danger' : 'warning';
  }
  get disableVariant() {
    return 'neutral';
  }

  get variant() {
    return this.args.enable ? this.enableVariant : this.disableVariant;
  }
}
