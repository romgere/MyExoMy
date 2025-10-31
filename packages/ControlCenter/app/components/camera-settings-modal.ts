import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import {
  defaultFps,
  defaultMirror,
  defaultQuality,
  defaultResolution,
  defaultRotation,
  resolutions,
  type Rotation,
} from '../utils/camera-const';
import { SlChangeEvent, SlRadioGroup, SlRange, SlSelect } from '@shoelace-style/shoelace';
import type { Mirror } from 'pi-camera-native-ts';
import { CameraSettings } from '@robot/shared/camera';

interface Args {
  open: boolean;
  onClose: () => void;
  onApply: (settings: CameraSettings) => void;
}

export default class ConnectionStatusComponent extends Component<Args> {
  // Settings list
  resolutions = resolutions;

  @tracked
  resolution = defaultResolution;

  @tracked
  fps: number = defaultFps;

  @tracked
  mirror: Mirror = defaultMirror;

  @tracked
  rotation: Rotation = defaultRotation;

  @tracked
  quality: number = defaultQuality;

  private get cameraConfig(): CameraSettings {
    const resolution = resolutions[this.resolution];

    return {
      width: resolution.width,
      height: resolution.height,
      fps: this.fps,
      mirror: this.mirror,
      rotation: this.rotation,
      quality: this.quality,
    };
  }

  @action
  resetSettings() {
    this.resolution = defaultResolution;
    this.fps = defaultFps;
    this.rotation = defaultRotation;
    this.mirror = defaultMirror;
    this.quality = defaultQuality;
  }

  @action
  changeResolution(event: SlChangeEvent) {
    this.resolution = (event.target as SlSelect).value as string;
  }

  @action
  changeFPS(event: SlChangeEvent) {
    this.fps = (event.target as SlRange).value;
  }

  @action
  changeMirror(event: SlChangeEvent) {
    this.mirror = parseInt((event.target as SlRadioGroup).value) as Mirror;
  }

  @action
  changeRotation(event: SlChangeEvent) {
    this.rotation = parseInt((event.target as SlRadioGroup).value) as Rotation;
  }

  @action
  changeQuality(event: SlChangeEvent) {
    this.quality = (event.target as SlRange).value;
  }

  @action
  onApply() {
    this.args.onApply(this.cameraConfig);
  }
}
