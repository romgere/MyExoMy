/* eslint-disable @typescript-eslint/no-explicit-any */
const logger = {
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  log: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(message, ...args);
  },
};
export default logger;
