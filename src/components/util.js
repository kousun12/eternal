// @flow
import React, { type Node } from 'react';
import type { Pos } from 'types';
import type { AnyNode } from 'models/NodeBase';
import { addVec, scaleVec, subVec } from 'utils/vector';

const fromTop = 51;
const itemH = 22;
const inLeft = 0;
const outLeft = 198;

export function inOffset(x: number, y: number, index: number): Pos {
  return { x: x + inLeft, y: y + fromTop + index * itemH };
}

export function outOffset(x: number, y: number, index: number): Pos {
  return { x: x + outLeft, y: y + fromTop + index * itemH };
}

export const worldToGraph = (mousePos: Pos, scaleInverse: number): Pos => {
  const mid = window.centerP || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  return addVec(mid, scaleVec(subVec(mousePos, mid), scaleInverse));
};

export const signatureFor = (
  clazz: Class<AnyNode>,
  maxLen: number = 0,
  style?: ?Object = null
): Node => {
  let argT = clazz.inKeys().join(', ');
  let returnT = clazz.outKeys().join(', ');
  if (maxLen) {
    if (argT.length > maxLen - 3) {
      argT = argT.substring(0, maxLen) + '...';
    }
    if (returnT.length > maxLen - 3) {
      returnT = returnT.substring(0, maxLen) + '...';
    }
  }
  return (
    <div style={style}>
      {`(${argT})`} <span style={{ color: 'rgba(200, 200, 200, 0.5)' }}>➜</span> {`(${returnT})`}
    </div>
  );
};
