import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import {
  defaultAwb,
  defaultExposure,
  defaultFlip,
  defaultFps,
  defaultResolution,
  defaultRotation,
  genericAdvancedRangeSettings,
  resolutions,
} from '../utils/camera-const';
import { SlChangeEvent, SlRadioGroup, SlRange, SlSelect, SlSwitch } from '@shoelace-style/shoelace';
import type { AwbMode, CameraConfig, ExposureMode, Flip, Rotation } from '@robot/shared/camera';

interface Args {
  open: boolean;
  onClose: () => void;
  onApply: (settings: CameraConfig) => void;
}

type GenericRangeValues = Record<keyof typeof genericAdvancedRangeSettings, number>;

const genericSettingsValues: GenericRangeValues = Object.entries(
  genericAdvancedRangeSettings,
).reduce<GenericRangeValues>((acc, [name, settings]) => {
  acc[name] = settings.default;
  return acc;
}, {});

export default class ConnectionStatusComponent extends Component<Args> {
  // Settings list
  resolutions = resolutions;
  genericAdvancedRangeSettings = genericAdvancedRangeSettings;

  @tracked
  resolution = defaultResolution;

  @tracked
  fps: number = defaultFps;

  @tracked
  flip: Flip = defaultFlip;

  @tracked
  rotation: Rotation = defaultRotation;

  @tracked
  exposure: ExposureMode = defaultExposure;

  @tracked
  awb: AwbMode = defaultAwb;

  @tracked
  genericRanges = genericSettingsValues;

  @tracked
  iso = 500;

  @tracked
  isoAuto = true;

  private get genericRangeValues() {
    const values = { ...this.genericRanges };
    for (const name in genericAdvancedRangeSettings) {
      const f = genericAdvancedRangeSettings[name].factor ?? 1;
      values[name] = values[name] * f;
    }

    return values;
  }

  private get cameraConfig(): CameraConfig {
    const resolution = resolutions[this.resolution];

    return {
      width: resolution.width,
      height: resolution.height,
      fps: this.fps,
      flip: this.flip,
      rotation: this.rotation,
      awbMode: this.awb,
      exposureMode: this.exposure,
      ...this.genericRangeValues,
      ...(this.isoAuto ? {} : { iso: this.iso }),
    };
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
  changeFlip(event: SlChangeEvent) {
    this.flip = (event.target as SlRadioGroup).value as Flip;
  }

  @action
  changeRotation(event: SlChangeEvent) {
    this.rotation = parseInt((event.target as SlRadioGroup).value);
  }

  @action
  changeExposure(event: SlChangeEvent) {
    this.exposure = (event.target as SlSelect).value as ExposureMode;
  }

  @action
  changeAwb(event: SlChangeEvent) {
    this.awb = (event.target as SlSelect).value as AwbMode;
  }

  @action
  changeGenericRange(name: keyof typeof genericAdvancedRangeSettings, event: SlChangeEvent) {
    const value = (event.target as SlRange).value;
    this.genericRanges = {
      ...this.genericRanges,
      [name]: value,
    };
  }

  @action
  changeIso(event: SlChangeEvent) {
    this.iso = (event.target as SlRange).value;
  }

  @action
  changeIsoAuto(event: SlChangeEvent) {
    this.isoAuto = !(event.target as SlSwitch).checked;
  }

  @action
  onApply() {
    this.args.onApply(this.cameraConfig);
  }
}
