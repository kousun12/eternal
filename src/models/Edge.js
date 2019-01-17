// @flow

import { uuid } from 'helpers';
import type { AnyNode } from 'models/NodeBase';

export type EdgeSerialization = {
  id: string,
  fromId: string,
  fromPort: string,
  toId: string,
  toPort: string,
};

export default class Edge {
  id: string;
  from: AnyNode;
  to: AnyNode;
  fromPort: string;
  toPort: string;
  _notifyCount: number = 0;
  notifyListener: ?() => void = null;

  constructor(from: AnyNode, to: AnyNode, fromPort: string, toPort: string, id?: string) {
    this.id = id || uuid();
    this.from = from;
    this.to = to;
    this.fromPort = fromPort;
    this.toPort = toPort;
  }

  outDataFor = (data: Object) => ({ [this.toPort]: data[this.fromPort] });
  inDataFor = (change: Object) => change[this.toPort];

  notify = () => {
    this._notifyCount += 1;
    this.notifyListener && this.notifyListener();
  };

  serialize: () => EdgeSerialization = () => {
    return {
      id: this.id,
      fromId: this.from.id,
      fromPort: this.fromPort,
      toId: this.to.id,
      toPort: this.toPort,
    };
  };

  static load(j: EdgeSerialization, nodes: AnyNode[]) {
    const from = nodes.find(n => n.id === j.fromId);
    const to = nodes.find(n => n.id === j.toId);
    if (!from || !to) {
      throw Error('could not load graph');
    }
    return new Edge(from, to, j.fromPort, j.toPort, j.id);
  }
}
