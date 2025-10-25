/* eslint-disable @typescript-eslint/no-explicit-any */
const logger = (serviceName: string) => ({
  error: (message: string, ...args: any[]) => {
    console.error(`${serviceName} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`${serviceName} - ${message}`, ...args);
  },
  log: (message: string, ...args: any[]) => {
    console.log(`${serviceName} - ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`${serviceName} - ${message}`, ...args);
  },
});
export type Logger = ReturnType<typeof logger>;
export default logger;
