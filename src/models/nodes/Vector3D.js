// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import type { Pos3 } from 'types';
const Types = window.Types;

type P = Pos3;
type S = { value: Pos3 };
type O = { out: Pos3 };

export default class Vector3D extends NodeBase<S, P, O> {
  static +displayName = 'Vector 3D';
  static +registryName = 'Vector3D';

  static description = (
    <span>
      A two dimensional vector with <code>x</code> <code>y</code> and <code>y</code> components
    </span>
  );

  static schema = {
    input: { x: Types.number, y: Types.number, z: Types.number },
    output: { out: Types.Vec3 },
    state: { value: Types.Vec3 },
  };

  onInputChange = () => {
    this.state.value = this.props;
    return this.outKeys();
  };

  process = () => {
    return { out: this.state.value };
  };
}
