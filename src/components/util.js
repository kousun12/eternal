// @flow
import React, { type Node } from 'react';
import type { Pos } from 'types';
import type { AnyNode } from 'models/NodeBase';

window.$eTop = 49;
window.$eHeight = 22;
window.$eInL = 15;
window.$eOutL = 173;

export function inOffset(x: number, y: number, index: number): Pos {
  return { x: x + window.$eInL, y: y + window.$eTop + index * window.$eHeight };
}

export function outOffset(x: number, y: number, index: number): Pos {
  return { x: x + window.$eOutL, y: y + window.$eTop + index * window.$eHeight };
}

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
