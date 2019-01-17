// @flow

import type NodeBase from 'models/NodeBase';

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
  node: NodeBase<any, any, any>,
  pos: Pos,
};
