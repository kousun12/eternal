// @flow

import type { Pos } from 'types';

export const addVec = (v1: Pos, v2: Pos): Pos => {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
};

export const subVec = (v1: Pos, v2: Pos): Pos => {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
};

export type Direction = 'left' | 'right' | 'up' | 'down';

export const unitVec = (dir: Direction): Pos => {
  switch (dir) {
    case 'left':
      return { x: 1, y: 0 };
    case 'right':
      return { x: -1, y: 0 };
    case 'up':
      return { x: 0, y: 1 };
    case 'down':
      return { x: 0, y: -1 };
    default:
      throw Error('invalid dir');
  }
};

export const scaleVec = (v: Pos, scale: number): Pos => {
  return { x: v.x * scale, y: v.y * scale };
};
