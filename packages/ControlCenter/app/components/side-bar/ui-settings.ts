import Component from '@glimmer/component';

interface Args {
  showHud: boolean;
  toggleHud: () => void;
  fullHud: boolean;
  toggleFullHud: () => void;
  showVJoy: boolean;
  toggleVirtualJoystick: () => void;
  showVideo: boolean;
  toggleVideo: () => void;
  setAspectRatio: (s: '4:3' | '19:9') => void;
}

export default class UISettingsComponent extends Component<Args> {}
