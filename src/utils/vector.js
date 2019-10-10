// @flow

import type { Pos } from 'types';

export const addVec = (v1: Pos, v2: Pos): Pos => {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
};

export const subVec = (v1: Pos, v2: Pos): Pos => {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
};

export type Direction = 'left' | 'right' | 'up' | 'down';

const units = {
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
};
export const unitVec = (dir: Direction): Pos => units[dir];

export const scaleVec = (v: Pos, scale: number): Pos => {
  return { x: v.x * scale, y: v.y * scale };
};
