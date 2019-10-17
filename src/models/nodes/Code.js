// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';

const Types = window.Types;

export class JSCodeNode extends NodeBase<
  {},
  { userCode: string, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any },
  { return: any, error: any }
> {
  static +displayName = 'JavaScript';
  static +defaultProps = { userCode: '' };
  static +registryName = 'JSCodeNode';
  static description = (
    <span>
      Define arbitrary JS code in this node. Runtime compatibility is based on your browser
    </span>
  );
  static schema = {
    input: {
      userCode: Types.string
        .aliased(
          'JSFunction',
          <div>
            A valid JS code block. You should call <code>return</code> at the end of your function
            to provide an output.
          </div>
        )
        .desc(
          <p>
            A JS code block that returns something over the inputs. You can reference variables by
            input name, e.g. <code>arg1</code>
          </p>
        ),
      arg1: Types.any.desc(
        <p>
          Any arg to supply to the user code block, accessible via <code>arg1</code>
        </p>
      ),
      arg2: Types.any.desc(
        <p>
          Any arg to supply to the user code block, accessible via <code>arg2</code>
        </p>
      ),
      arg3: Types.any.desc(
        <p>
          Any arg to supply to the user code block, accessible via <code>arg3</code>
        </p>
      ),
      arg4: Types.any.desc(
        <p>
          Any arg to supply to the user code block, accessible via <code>arg4</code>
        </p>
      ),
      arg5: Types.any.desc(
        <p>
          Any arg to supply to the user code block, accessible via <code>arg5</code>
        </p>
      ),
    },
    output: {
      return: Types.any.desc('Whatever was returned in the userCode block'),
      error: Types.any.desc('If the user code errored, this is the exception and function'),
    },
    state: {},
  };

  make = () =>
    window
      .Function(
        `"use strict";
const arg1 = this.arg1;
const arg2 = this.arg2;
const arg3 = this.arg3;
const arg4 = this.arg4;
const arg5 = this.arg5;
${this.props.userCode}`
      )
      .bind(this.props);

  requireForOutput = () => Boolean(this.props.userCode);
  process = () => {
    const fn = this.make();
    let r;
    try {
      r = fn();
    } catch (e) {
      return { error: { error: e, fn }, return: undefined };
    }

    return { return: r, error: undefined };
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}
