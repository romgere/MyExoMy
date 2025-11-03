export const battery3sLevels = [
  { percent: 100, value: 12.6 },
  { percent: 90, value: 12.33 },
  { percent: 80, value: 12.06 },
  { percent: 70, value: 11.85 },
  { percent: 60, value: 11.61 },
  { percent: 50, value: 11.52 },
  { percent: 40, value: 11.4 },
  { percent: 30, value: 11.31 },
  { percent: 20, value: 11.19 },
  { percent: 10, value: 11.07 },
  { percent: 5, value: 10.83 },
  { percent: 0, value: 9.82 },
];

export function voltToPercent(v: number) {
  return battery3sLevels.find(({ value }) => v >= value)?.percent ?? 0;
}
