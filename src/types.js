// @flow

import type { AnyNode } from 'models/NodeBase';

export type Pos = {
  x: number,
  y: number,
};

export type Pos3 = {
  x: number,
  y: number,
  z: number,
};

export type NodeInSpace = {
  node: AnyNode,
  pos: Pos,
};
