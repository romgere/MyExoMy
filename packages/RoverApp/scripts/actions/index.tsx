import { CameraTest } from './camera-test.tsx';
import { MotorPin } from './motor-pin/index.tsx';
import { MotorPwm } from './motor-pwm.tsx';
import { MotorStop } from './motor-stop.tsx';
import { MotorTest } from './motor-test.tsx';
import { SetSMSRecipent } from './set-sms-sender.tsx';
import { SetSSHTunnel } from './set-ssh-tunnel.tsx';
import { HardironCalibration } from './hardiron.tsx';
import { OrientationDeviation } from './orientation-deviation.tsx';
import { AxeInversion } from './axe-inversion.tsx';

export type PageArg = {
  onFinish: () => void;
};

export type Page = ({ onFinish }: PageArg) => React.JSX.Element;
export type PageName =
  | 'pin_config'
  | 'adjust_pwm'
  | 'stop_motors'
  | 'test_motors'
  | 'test_camera'
  | 'set_sms_recipient'
  | 'set_ssh_tunnel'
  | 'hardiron'
  | 'orientation_deviation'
  | 'axe_inversion';

const pages: Record<PageName, { page: Page; label: string }> = {
  pin_config: {
    page: MotorPin,
    label: 'Run motor pin configuration wizard',
  },
  adjust_pwm: {
    page: MotorPwm,
    label: 'Adjust motors PWM (min, max & neutral)',
  },
  stop_motors: {
    page: MotorStop,
    label: 'Stop all motors',
  },
  test_motors: {
    page: MotorTest,
    label: 'Test a motor',
  },
  test_camera: {
    page: CameraTest,
    label: 'Test camera (record to file)',
  },
  set_sms_recipient: {
    page: SetSMSRecipent,
    label: 'Set SMS recipient',
  },
  set_ssh_tunnel: {
    page: SetSSHTunnel,
    label: 'SSH tunnel settings',
  },
  hardiron: {
    page: HardironCalibration,
    label: 'HardIron calibration',
  },
  axe_inversion: {
    page: AxeInversion,
    label: 'Axes inversion',
  },
  orientation_deviation: {
    page: OrientationDeviation,
    label: 'Orientation deviation',
  },
};

export const pageNames = Object.keys(pages) as PageName[];

export default pages;
