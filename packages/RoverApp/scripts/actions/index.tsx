import { MotorPin } from './motor-pin/index.tsx';
import { MotorPwm } from './motor-pwm.tsx';
import { MotorStop } from './motor-stop.tsx';

export type PageArg = {
  onFinish: () => void;
};

export type Page = ({ onFinish }: PageArg) => React.JSX.Element;
export type PageName = 'pin_config' | 'adjust_pwm' | 'stop_motors';

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
};

export const pageNames = Object.keys(pages) as PageName[];

export default pages;
