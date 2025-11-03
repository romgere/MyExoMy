export const battery3sLevels = [
  { percent: 100, value: 12.6 },
  { percent: 95, value: 12.45 },
  { percent: 90, value: 12.33 },
  { percent: 85, value: 12.24 },
  { percent: 80, value: 12.06 },
  { percent: 75, value: 11.94 },
  { percent: 70, value: 11.85 },
  { percent: 65, value: 11.73 },
  { percent: 60, value: 11.61 },
  { percent: 55, value: 11.55 },
  { percent: 50, value: 11.52 },
  { percent: 45, value: 11.46 },
  { percent: 40, value: 11.4 },
  { percent: 35, value: 11.37 },
  { percent: 30, value: 11.31 },
  { percent: 25, value: 11.25 },
  { percent: 20, value: 11.19 },
  { percent: 15, value: 11.13 },
  { percent: 10, value: 11.07 },
  { percent: 5, value: 10.83 },
  { percent: 0, value: 9.82 },
];

export function voltToPercent(v: number) {
  return battery3sLevels.find(({ value }) => v >= value)?.percent ?? 0;
}
