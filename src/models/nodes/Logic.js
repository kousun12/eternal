// @flow
import React from 'react';
import { uniq } from 'lodash';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';

const Types = window.Types;

export class EqualsNode extends NodeBase<{}, { numbers: any[] }, { result: boolean }> {
  static +displayName = 'Equals';
  static +registryName = 'EqualsNode';
  static description = <span>Strict equals operator</span>;
  static schema = {
    input: { input: Types.any.desc('Any set of members to perform strict equals over') },
    output: { result: Types.number.desc('Logical equals over inputs') },
    state: {},
  };
  _map: { [string]: any } = {};

  process = () => ({ result: uniq(this.inputs.map(e => this._map[e.id])).length === 1 });

  onInputChange = (edge: Edge, change: Object) => {
    this._map[edge.id] = edge.inDataFor(change);
    return this.outKeys();
  };
}

export class AndNode extends NodeBase<{}, { numbers: any[] }, { result: boolean }> {
  static +displayName = 'AND';
  static +registryName = 'AndNode';
  static description = <span>Logical AND over inputs</span>;
  static schema = {
    input: { input: Types.any.desc('Any set of members to logical `AND` over') },
    output: { result: Types.number.desc('Logical and of inputs') },
    state: {},
  };
  _map: { [string]: any } = {};

  process = () => ({ result: this.inputs.reduce((memo, e) => memo && this._map[e.id], true) });

  onInputChange = (edge: Edge, change: Object) => {
    this._map[edge.id] = edge.inDataFor(change);
    return this.outKeys();
  };
}

export class OrNode extends NodeBase<{}, { numbers: any[] }, { result: boolean }> {
  static +displayName = 'OR';
  static +registryName = 'OrNode';
  static description = <span>Logical OR over inputs</span>;
  static schema = {
    input: { input: Types.any.desc('Any set of members to logical `OR` over') },
    output: { result: Types.number.desc('Logical OR of inputs') },
    state: {},
  };
  _map: { [string]: any } = {};

  process = () => ({ result: this.inputs.reduce((memo, e) => memo || this._map[e.id], false) });

  onInputChange = (edge: Edge, change: Object) => {
    this._map[edge.id] = edge.inDataFor(change);
    return this.outKeys();
  };
}

export class NotNode extends NodeBase<{}, { in: any }, { result: boolean }> {
  static +displayName = 'Not';
  static +registryName = 'NotNode';
  static description = <span>logical not</span>;
  static schema = {
    input: { in: Types.any.desc('anything. negation follows regular js semantics') },
    output: { result: Types.boolean },
    state: {},
  };

  process = () => ({ result: !this.props.in });
  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}
