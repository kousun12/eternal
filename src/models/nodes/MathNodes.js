// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';

const Types = window.Types;

export class DivideNode extends NodeBase<
  {},
  { dividend: number, divisor: number },
  { result: number, int: number }
> {
  static +displayName = 'Divide';
  static +registryName = 'DivideNode';
  static +defaultProps = { dividend: 0, divisor: 1 };
  static description = <span>Divide one number by another</span>;
  static schema = {
    input: { dividend: Types.number, divisor: Types.number },
    output: { result: Types.number, int: Types.number },
    state: {},
  };

  process = () => ({
    result: this.props.dividend / this.props.divisor,
    int: parseInt(this.props.dividend / this.props.divisor, 10),
  });

  onInputChange = () => (this.props.dividend && this.props.divisor ? this.outKeys() : []);
}

export class SumNode extends NodeBase<{}, { numbers: number[] }, { result: number }> {
  static +displayName = 'Sum';
  static +registryName = 'SumNode';
  static description = <span>Sum across numbers</span>;
  static schema = {
    input: { numbers: Types.number.desc('All numbers to add together') },
    output: { result: Types.number.desc('Sum') },
    state: {},
  };
  _map: { [string]: number } = {};

  process = () => ({ result: this.inputs.reduce((memo, e) => memo + this._map[e.id] || 0, 0) });

  onInputChange = (edge: Edge, change: Object) => {
    this._map[edge.id] = edge.inDataFor(change);
    return this.outKeys();
  };
}

export class ProductNode extends NodeBase<{}, { numbers: number[] }, { result: number }> {
  static +displayName = 'Product';
  static +registryName = 'ProductNode';
  static description = <span>Multiply over numbers</span>;
  static schema = {
    input: { numbers: Types.number.desc('All numbers to multiply together') },
    output: { result: Types.number.desc('Product') },
    state: {},
  };
  _map: { [string]: number } = {};

  process = () => ({ result: this.inputs.reduce((memo, e) => memo * this._map[e.id] || 0, 1) });

  onInputChange = (edge: Edge, change: Object) => {
    this._map[edge.id] = edge.inDataFor(change);
    return this.outKeys();
  };
}

export class IntToIntMathNode extends NodeBase<
  {},
  { fn: string, in: number },
  { result: ?number }
> {
  static +displayName = 'Math: Int -> Int';
  static +registryName = 'IntToIntMathNode';
  static description = (
    <div>
      Admittedly a node borne of laziness -- given a standard js math package operation name, this
      node performs that operation. Constants are included. Full signature list in MathFnIntInt
      help. For non unary functions like <code>min</code>, an array argument can be spread into the
      args.
    </div>
  );
  static schema = {
    input: {
      fn: Types.string
        .aliased(
          'MathFn',
          <div>
            <p>Signatures for the available functions</p>
            <p>
              E: number; LN10: number; LN2: number; LOG10E: number; LOG2E: number; PI: number;
              SQRT1_2: number; SQRT2: number; abs(x: number): number; acos(x: number): number;
              acosh(x: number): number; asin(x: number): number; asinh(x: number): number; atan(x:
              number): number; atan2(y: number, x: number): number; atanh(x: number): number;
              cbrt(x: number): number; ceil(x: number): number; cos(x: number): number; cosh(x:
              number): number; exp(x: number): number; expm1(x: number): number; floor(x: number):
              number; fround(x: number): number; log(x: number): number; log10(x: number): number;
              log1p(x: number): number; log2(x: number): number; pow(x: number, y: number): number;
              random(): number; round(x: number): number; sign(x: number): number; sin(x: number):
              number; sinh(x: number): number; sqrt(x: number): number; tan(x: number): number;
              tanh(x: number): number; trunc(x: number): number; max(...args: number[]);
              min(...args: number[])
            </p>
          </div>
        )
        .desc('The function name. Check type info for options'),
      in: Types.number,
    },
    output: { result: Types.number },
    state: {},
  };

  requireForOutput = () =>
    (this.props.in || typeof this.props.in === 'number') && typeof this.props.fn === 'string';

  process = () => {
    return {
      result: Math[this.props.fn].apply(
        null,
        Array.isArray(this.props.in) ? this.props.in : [this.props.in]
      ),
    };
  };

  onInputChange = (edge: Edge, change: Object) => {
    return this.outKeys();
  };
}
