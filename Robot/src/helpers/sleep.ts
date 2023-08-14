export default function sleep(msTime: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, msTime);
  });
}
