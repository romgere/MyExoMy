export default function wait(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
