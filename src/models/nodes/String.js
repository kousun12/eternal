// @flow
import React from 'react';
import { get } from 'lodash';
import NodeBase from 'models/NodeBase';
const Types = window.Types

export class PlusNode extends NodeBase<{}, { left: any, right: any }, { out: any }> {
  static +displayName = 'Plus';
  static +registryName = 'PlusNode';
  static description = <span>A plus operator. Usable with both strings and numbers.</span>;
  static schema = {
    input: {
      left: Types.any.desc('left hand side'),
      right: Types.any.desc('right hand side'),
    },
    output: { out: Types.any.desc('The result') },
    state: {},
  };

  process = () => ({
    out: this.props.left + this.props.right,
  });
}
