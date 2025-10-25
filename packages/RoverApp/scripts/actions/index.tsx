import { CameraTest } from './camera-test.tsx';
import { MotorPin } from './motor-pin/index.tsx';
import { MotorPwm } from './motor-pwm.tsx';
import { MotorStop } from './motor-stop.tsx';
import { MotorTest } from './motor-test.tsx';
import { SetSMSRecipent } from './set-sms-sender.tsx';

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
  | 'set_sms_recipient';

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
};

export const pageNames = Object.keys(pages) as PageName[];

export default pages;
