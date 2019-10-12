// @flow
import NodeBase from 'models/NodeBase';
import React from 'react';
const Types = window.Types;

type P = { value: any, interval: number };
type S = { count: number };
type O = { count: number, value: any };

const intervalDesc = 'The interval at which this node will emit, in miliseconds';
const countDesc = 'The number of times this node has emitted so far.';

export default class IntervalNode extends NodeBase<S, P, O> {
  count: number = 0;
  static displayName = 'Interval';
  static +registryName = 'IntervalNode';
  static description = (
    <span>A node which emits any value and a count at a regular time interval.</span>
  );
  static defaultProps = { interval: 1000 };
  static schema = {
    input: {
      value: Types.any.desc('Any input to emit at this interval'),
      interval: Types.number.desc(intervalDesc),
    },
    output: {
      count: Types.number.desc(countDesc),
      value: Types.any.desc('The input value passed in'),
    },
    state: {},
  };

  subscriptionId: ?IntervalID;

  _clearSubscription = () => {
    if (this.subscriptionId) {
      clearInterval(this.subscriptionId);
      this.subscriptionId = null;
    }
  };

  _resetCount = () => {
    this.count = 0;
  };

  _startInterval = () => {
    this._clearSubscription();
    this._resetCount();
    this.subscriptionId = setInterval(() => {
      this.count += 1;
      this.notifyOutputs(this.outKeys(), true);
    }, this.props.interval);
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (!prevProps || newProps.interval !== prevProps.interval) {
      this._startInterval();
    }
  };

  afterConnectOut = () => {
    if (this.outputs.length === 1 && !this.subscriptionId) {
      this._startInterval();
    }
  };

  process = () => {
    return { count: this.count, value: this.props.value };
  };

  // do not notify on input changes
  onInputChange = () => [];
}
