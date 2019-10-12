// @flow
import React from 'react';
import { get, reverse, set } from 'lodash';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { TT } from 'models/nodes/ToneNode';
import { arrayOf } from 'utils/typeUtils';
const Types = window.Types;

export class InfoLog extends NodeBase<{}, { anything: any }, { anything: any }> {
  static +displayName = 'InfoLog';
  static +registryName = 'InfoLog';
  static description = <span>Log any inputs as they come to console info</span>;
  static schema = {
    input: { anything: Types.any.desc('Anything you would like to log') },
    output: { anything: Types.any.desc('The input, passed through') },
    state: {},
  };

  process = () => ({ anything: this.props.anything });

  onInputChange = (edge: Edge, change: Object) => {
    console.log(edge.from.constructor.displayName, edge.fromPort, edge.inDataFor(change));
    return this.outKeys();
  };
}

export class JSONParse extends NodeBase<{}, { in: string }, { out: Object }> {
  static +displayName = 'JSON Parse';
  static +registryName = 'JSONParse';
  static description = <span>Parse a string into an object</span>;
  static schema = {
    input: { in: Types.string.desc('String serialization') },
    output: { out: Types.object.desc('Parsed object') },
    state: {},
  };

  process = () => ({ out: this.props.in ? JSON.parse(this.props.in) : {} });

  onInputChange = () => this.outKeys();
}

export class ExtractNode extends NodeBase<{}, { from: any, get: string }, { out: any }> {
  static +displayName = 'Extract';
  static +registryName = 'ExtractNode';
  static description = <span>Extract a value from an object. Complement of SetNode</span>;
  static schema = {
    input: {
      from: Types.object.desc('Object to extract from'),
      get: Types.string.desc(
        <span>
          The key to get. You can traverse an object with dot notation, i.e. <code>foo.bar</code>
        </span>
      ),
    },
    output: {
      out: Types.any.desc(
        <span>
          The extracted value, or <code>undefined</code>
        </span>
      ),
    },
    state: {},
  };

  process = () => ({ out: get(this.props.from, this.props.get || '') });

  onInputChange = () => this.outKeys();
}

export class SetNode extends NodeBase<{}, { target: any, path: string, value: any }, { out: any }> {
  static +displayName = 'Set Value';
  static +registryName = 'SetNode';
  static description = <span>Set a value on any object / array. Complement of ExtractNode</span>;
  static schema = {
    input: {
      target: Types.object.desc('Object / array to set to'),
      path: Types.string.desc(
        <span>
          The path to set at. You can use dot notation, i.e. <code>foo.bar</code>
        </span>
      ),
      value: Types.any.desc('The value to set at path.'),
    },
    output: {
      out: Types.any.desc(
        <span>
          The extracted value, or <code>undefined</code>
        </span>
      ),
    },
    state: {},
  };
  _val: any;

  process = () => ({ out: this._val });

  onInputChange = () => {
    this._val = set(this.props.target, this.props.path || '', this.props.value);
    return this.outKeys();
  };
}

export class StephenWolfram extends NodeBase<
  {},
  { rule: number, state: (0 | 1)[] | string },
  { out: (0 | 1)[] }
> {
  static +displayName = 'Stephen Wolfram';
  static +registryName = 'StephenWolfram';
  static description = (
    <span>
      Stephen Wolfram is an operator that, when given a 1D cellular automata rule number [0-255] and
      a binary representation of the world, outputs the subsequent state of the world according to
      that rule. He can do this indefinitely and is, in fact, Earth's first eternal human.
    </span>
  );
  static schema = {
    input: {
      rule: Types.number.desc(
        'The rule number. Given a binary state and two neighbors (2^3 states), a transition rule set can be encoded with a binary number with each digit slot representing the next state of that configuration (2^(2^3) rule sets).'
      ),
      initialState: Types.any.desc(
        "He doesn't know or care where it comes from, but Wolfram needs an initial state in order to operate. His world is probably circular, so the first index and last index are assumed to be neighbors for rule application. Both binary strings and binary arrays are acceptable."
      ),
      call: TT.Call,
    },
    output: { out: arrayOf(Types.number).desc('The resulting binary array') },
    state: {},
  };

  currentState: (0 | 1)[] = [];
  transitions: (0 | 1)[];

  static toBin8(rule: number): (0 | 1)[] {
    const bin = [...rule.toString(2)].map(s => parseInt(s, 10));
    if (bin.length < 8) {
      bin.unshift(...[...new Array(8 - bin.length)].map(() => 0));
    }
    // $FlowIssue
    return reverse(bin);
  }

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (!prevProps || newProps.rule !== prevProps.rule) {
      this.transitions = StephenWolfram.toBin8(newProps.rule);
    }
    if (!prevProps || newProps.initialState !== prevProps.initialState) {
      const state = newProps.initialState;
      if (Array.isArray(state)) {
        this.currentState = state.map(a => parseInt(a));
      } else if (typeof state === 'string') {
        this.currentState = state.split('').map(s => parseInt(s));
      }
    }
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('call' === edge.toPort) {
      if (edge.inDataFor(change)) {
        const { rule } = this.props;
        const state = this.currentState;
        if (state && Array.isArray(state) && typeof rule === 'number') {
          this.currentState = state.map((i, index) => {
            const lIdx = (((index - 1) % state.length) + state.length) % state.length;
            const rIdx = (index + 1) % state.length;
            // noinspection EqualityComparisonWithCoercionJS accept coercion for convenience
            // eslint-disable-next-line eqeqeq
            const num = (state[lIdx] == 1 ? 4 : 0) + (i == 1 ? 2 : 0) + (state[rIdx] == 1 ? 1 : 0);
            return this.transitions[num];
          });
          this.notifyAllOutputs(true);
        }
      }
    }
    return [];
  };

  process = () => ({ out: this.currentState });
}

export class CollectNode extends NodeBase<{}, { capacity: number, value: any }, { out: any[] }> {
  static +displayName = 'Collect';
  static +registryName = 'HistoryNode';
  static description = (
    <span>
      Buffer values from an input stream. If memory capacity is reached, oldest values are purged
      first
    </span>
  );
  static schema = {
    input: {
      capacity: Types.number.desc(
        'The max number of elements to keep. Omitting this means no limit'
      ),
      value: Types.any.desc('Any value. This will be pushed into the output collector'),
    },
    output: { out: arrayOf(Types.any).desc('The collected queue, oldest to newest.') },
    state: {},
  };

  memory: any[] = [];

  process = () => ({ out: this.memory });
  onInputChange = (edge: Edge, change: Object) => {
    if ('value' === edge.toPort) {
      const data = edge.inDataFor(change);
      if (data) {
        const { capacity } = this.props;
        if (typeof capacity === 'number' && this.memory.length >= capacity) {
          this.memory.shift();
        }
        // todo a better slice
        this.memory.push(data);
      }
    }
    return this.outKeys();
  };
}

export class JoinNode extends NodeBase<{}, { array: any[], separator: string }, { out: string }> {
  static +displayName = 'Join';
  static +registryName = 'JoinNode';
  static description = <span>Join an array of values together with a separator</span>;
  static schema = {
    input: {
      array: Types.object.desc('Array of any data. Ideally this data is string serializable.'),
      separator: Types.string.desc('Separator string to join elements together with'),
    },
    output: { out: Types.string.desc('The joined array, as a string') },
    state: {},
  };

  process = () => {
    const val = (this.props.array || []).join(this.props.separator || '');
    return { out: val };
  };

  onInputChange = () => this.outKeys();
}

export class RegexReplace extends NodeBase<
  {},
  { string: string, regex: RegExp | string, replacement: string },
  { out: string }
> {
  static +displayName = 'Regex Replace';
  static +registryName = 'RegexReplace';
  static description = <span>Replace a regex match with something else</span>;
  static schema = {
    input: {
      string: Types.string.desc('The string over which to perform the replace'),
      regex: Types.string.desc('the regexp'),
      replacement: Types.string.desc('The string to replace matches with'),
    },
    output: { out: Types.string.desc('The joined array, as a string') },
    state: {},
  };
  re: RegExp;

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (!prevProps || (newProps.regex !== prevProps.regex && newProps.regex)) {
      const parsed = newProps.regex.match(/\/(.+)\/(\w*)/);
      if (parsed) {
        // eslint-disable-next-line no-unused-vars
        const [_, t, f] = parsed;
        this.re = new RegExp(t, f);
      } else {
        this.re = new RegExp(newProps.regex);
      }
    }
  };

  process = () => {
    const { string, replacement } = this.props;
    if (string && this.re && typeof replacement !== 'object') {
      return { out: string.replace(this.re, replacement) };
    }
    return { out: '' };
  };

  onInputChange = (edge: Edge, change: Object) => {
    return this.outKeys();
  };
}

export class ArrayFillNode extends NodeBase<{}, { length: number, fillWith: any }, { out: any[] }> {
  static +displayName = 'Array Fill';
  static +registryName = 'ArrayFillNode';
  static description = <span>Create an array filled with a value</span>;
  static schema = {
    input: {
      length: Types.number.desc('The length of this array'),
      fillWith: Types.any.desc('The value to fill with'),
    },
    output: { out: arrayOf(Types.any).desc('An array, filled to length by value') },
    state: {},
  };

  process = (): { out: any[] } => ({
    out: [...new Array(this.props.length || 0)].map(() => this.props.fillWith),
  });

  onInputChange = () => this.outKeys();
}

export class CountSourceNode extends NodeBase<{}, {}, { count: number }> {
  static +displayName = 'Count Source';
  static +registryName = 'CountSourceNode';
  static description = <span>Create an array filled with a value</span>;
  static schema = {
    input: {},
    output: { count: Types.number.desc('The output count') },
    state: {},
  };
  _count = 0;

  process = () => ({ count: this._count++ });

  onInputChange = () => this.outKeys();
}
