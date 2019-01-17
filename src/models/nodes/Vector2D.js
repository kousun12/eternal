// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import type { Pos } from 'types';
const Types = window.Types;

type P = Pos;
type S = { value: Pos };
type O = { out: Pos };

export default class Vector2D extends NodeBase<S, P, O> {
  static +displayName = 'Vector 2D';
  static +registryName = 'Vector2D';

  static description = (
    <span>
      A two dimensional vector with keys <code>x</code> and <code>y</code>
    </span>
  );

  static schema = {
    input: { x: Types.number, y: Types.number },
    output: { out: Types.Vec2 },
    state: { value: Types.Vec2 },
  };

  onInputChange = () => {
    this.state.value = this.props;
    return this.outKeys();
  };

  process = () => {
    return { out: this.state.value };
  };
}
