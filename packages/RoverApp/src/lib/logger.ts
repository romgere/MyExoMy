function d() {
  const date = new Date();

  const yy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');

  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');

  const day = [yy, mm, dd].join('/');
  const time = [h, m, s, ms].join(':');

  return [day, time].join(' ');
}
/* eslint-disable @typescript-eslint/no-explicit-any */
const logger = (serviceName: string) => ({
  error: (message: string, ...args: any[]) => {
    console.error(`${d()} - ${serviceName} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`${d()} - ${serviceName} - ${message}`, ...args);
  },
  log: (message: string, ...args: any[]) => {
    console.log(`${d()} - ${serviceName} - ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`${d()} - ${serviceName} - ${message}`, ...args);
  },
});
export type Logger = ReturnType<typeof logger>;
export default logger;
