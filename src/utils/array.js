// @flow

export const range = (range: [number, number], increments: number, fixed: number = 2): number[] => {
  const r = [];
  let cur = range[0];
  while (cur <= range[1]) {
    r.push(cur);
    cur += increments;
  }
  return r.map(n => (fixed === 0 ? parseInt(n.toFixed(fixed), 10) : parseFloat(n.toFixed(fixed))));
};
