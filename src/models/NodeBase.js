/* eslint-disable no-use-before-define */
// @flow

import { type Node } from 'react';
import { startCase, pick, omitBy, isEqual, get, set, cloneDeep, fromPairs, uniq } from 'lodash';
import Edge from 'models/Edge';
import { uuid } from 'utils/string';
import { TypeImpl, type TypeMap } from 'models/AttributeType';
import { signatureFor } from 'components/util';

export default class NodeBase<Val: Object, In: ?Object, Out: ?Object> {
  +id: string;

  state: Val;
  props: $Shape<In>;

  inputs: Edge[] = [];
  outputs: Edge[] = [];

  // Private vars
  outputCache = {};
  live: boolean = false;
  isLoading: boolean = false;
  +listeners: { [string]: ChangeListener } = {};
  title: ?string;
  _unPushed: string[] = [];
  _loadStateListener: ?(boolean) => void;

  static +displayName: ?string;
  static +registryName: string;
  static +description: ?Node;
  static +isPrimitive: boolean = false;
  static +defaultState: ?$Shape<Val>;
  static +defaultProps: ?$Shape<In>;
  static +schema: Schema = { input: {}, output: {}, state: {} };
  static +shortNames: { [string]: string } = {};

  constructor(attrs?: $Shape<Val>, props?: $Shape<In>, nodeId?: string, title?: ?string) {
    this.id = nodeId || uuid();
    this.title = title;
    this.state = {
      ...this.constructor.initializeState(),
      ...this.constructor.defaultState,
      ...attrs,
    };
    if (this.constructor.defaultProps) {
      this.props = { ...this.constructor.defaultProps, ...props };
    } else {
      this.props = props || {};
    }
  }

  /**
   * Run this node over current state to compute an output
   * @param keys a subset of outKeys which should be processed
   */
  process: (string[]) => Out = keys => {
    throw new Error('unimplemented');
  };

  _process: (string[], boolean) => Out = (keys, force) => {
    if (!this.outKeys().length) {
      // $FlowIgnore
      return {};
    }
    const val = this.process(keys);
    // TODO: think about mutating objects in output cache. should we deep copy or not allow mutations?
    const forward = force ? val : omitBy(val, (v, k) => isEqual(v, this.outputCache[k]));
    this.outputCache = { ...this.outputCache, ...val };
    return forward;
  };

  /**
   * Called the first time this node is added to a graph
   */
  onAddToGraph = () => {};
  /**
   * This lifecycle hook is fired the first time this node is connected to all of its inputs.
   * Later this should be changed to fire only after all required inputs are supplied.
   */
  willBecomeLive: () => void = () => {};

  /**
   * This lifecycle hook is fired before this node is removed from a graph. It is your chance to clean up any
   * state that this node might have initialized.
   */
  willBeRemoved: () => void = () => {};

  beforeConnectOut: Edge => void = edge => {};
  afterConnectOut: Edge => void = edge => {};
  beforeConnectIn: Edge => void = edge => {};
  afterConnectIn: Edge => void = edge => {};

  beforeDisconnectOut: Edge => void = edge => {};
  afterDisconnectOut: Edge => void = edge => {};
  beforeDisconnectIn: Edge => void = edge => {};
  afterDisconnectIn: Edge => void = edge => {};

  requireForOutput: () => boolean = () => true;

  setLoadStateListener = (listener: boolean => void) => {
    this._loadStateListener = listener;
  };

  setLoading = (loading: boolean) => {
    this.isLoading = loading;
    this._loadStateListener && this._loadStateListener(loading);
  };

  addInput: (input: Edge) => void = input => {
    this.beforeConnectIn(input);
    this.inputs.push(input);
    if (input.from.requireForOutput() && input.from.outKeys().length) {
      const initialValue = input.from.process([input.toPort]);
      this._onInputChange(input, input.outDataFor(initialValue), true);
    } else {
      this._unPushed.push(input.id);
    }
    this._notifyLive(input);
    this.afterConnectIn(input);
  };

  // TODO change this to required inputs check toposort on initial graph walk
  _notifyLive = (input: Edge) => {
    if (!this.live) {
      const sKeys = this.constructor.inKeys();
      const iKeys = this.inputs.map(i => i.toPort).concat(input.toPort);
      if (sKeys.every(k => iKeys.includes(k))) {
        this.willBecomeLive();
        this.live = true;
      }
    }
  };

  forAllConnectedInputs = (handler: (key: string, val: any) => void) =>
    uniq(this.inputs.map(edge => edge.toPort)).map(k => handler(k, this.props && this.props[k]));

  addOutput: (output: Edge) => void = out => {
    this.beforeConnectOut(out);
    this.outputs.push(out);
    this.afterConnectOut(out);
  };

  removeInput: (Edge, onRemove?: () => void) => void = (input, onRemove) => {
    this.beforeDisconnectIn(input);
    this.inputs = this.inputs.filter(i => input.id !== i.id);
    this.afterDisconnectIn(input);
    onRemove && onRemove();
  };

  firstInput: string => ?AnyNode = forKey => {
    const edge: ?Edge = this.inputs.find(i => i.toPort === forKey);
    if (edge) {
      // $FlowIssue - dunno
      return edge.from;
    }
    return null;
  };

  removeOutput: (Edge, onRemove?: () => void) => void = (output, onRemove) => {
    this.beforeDisconnectOut(output);
    this.outputs = this.outputs.filter(i => output.id !== i.id);
    this.afterDisconnectOut(output);
    onRemove && onRemove();
  };

  registerListener: ChangeListener => string = listener => {
    const key = uuid();
    this.listeners[key] = listener;
    return key;
  };

  removeListener: string => boolean = id => {
    return delete this.listeners[id];
  };

  /**
   * Handle input changes from an edge
   * @param edge the edge that has notified this node of a change
   * @param change the change payload for that edge
   * @returns {Array} an array of output edges to propagate on
   */
  onInputChange: (edge: Edge, partialChange: $Shape<In>) => string[] = (edge, change) => {
    return [];
  };

  _onInputChange: (edge: Edge, partialChange: $Shape<In>, boolean) => void = (
    edge,
    change,
    force
  ) => {
    const oldProps = { ...this.props };
    this.props = this.props || {};
    // $FlowIgnore
    change && Object.keys(change).forEach(k => (this.props[k] = change[k]));
    let _force = force;
    if (this._unPushed.includes(edge.id)) {
      this._unPushed = this._unPushed.filter(id => id !== edge.id);
      _force = true;
    }
    this.willReceiveProps(this.props, oldProps, false);
    this.notifyOutputs(this.onInputChange(edge, change), _force);
  };

  /**
   * Called before new prop changes are set. Note that manually overriding props will also fire this method.
   * @param newProps
   * @param prevProps
   * @param manual whether or not the change was a manual change, as opposed to a connected change
   */
  willReceiveProps: (newProps: In, prefProps: In, boolean) => void = (
    newProps,
    prevProps,
    manual
  ) => {};

  /**
   * Notify some set of this node's output ports of changes
   * @param ofKeyChanges the output port keys which will be notified
   * @param force use this flag to force propagation updates, even if the value has not changed
   */
  notifyOutputs: (string | string[], force?: boolean) => void = (ofKeyChanges, force = false) => {
    if (!this.requireForOutput()) {
      return;
    }
    const asList = Array.isArray(ofKeyChanges) ? ofKeyChanges : [ofKeyChanges];
    const val = this._process(asList, force);
    const changes = pick(val, asList);
    for (let listener in this.listeners) {
      this.listeners[listener](this);
    }
    this.outputs
      .filter(e => e.from.id === this.id && e.fromPort in changes)
      .forEach(edge => {
        edge.to._onInputChange(edge, edge.outDataFor(changes), force);
        edge.notify();
      });
  };

  notifyAllOutputs = (force?: boolean = false) => this.notifyOutputs(this.outKeys(), force);

  inKeys = (): string[] => this.constructor.inKeys();
  inKeyAt = (i: number): string => this.inKeys()[i];
  outKeys = (): string[] => this.constructor.outKeys();
  outKeyAt = (i: number): string => this.outKeys()[i];

  connectedInputKeys = () => uniq(this.inputs.map(e => e.toPort));
  connectedOutputKeys = () => uniq(this.outputs.map(e => e.fromPort));

  name = () => {
    let defName;
    if (this.title) {
      return this.title;
    } else if (this.constructor.isPrimitive && uniq(this.outputs.map(e => e.toPort)).length === 1) {
      defName = this.outputs[0].toPort;
    } else {
      defName = NodeBase.nameFrom(this.constructor);
    }
    if (window['$debug']) {
      const { value } = this.state;
      const hasVal = value || value === false || value === 0;
      return this.constructor.isPrimitive ? (hasVal ? String(value) : defName) : defName;
    } else {
      return defName;
    }
  };

  /**
   * All the dynamic user-changeable attributes for this node.
   * You probably shouldn't override this method, but instead use other
   * methods / class attributes to include extras or exclude defaults
   * @returns {[string]: Changeable[]} lists of all changeables for this node under a key category.
   */
  changeables: () => { [string]: Changeable[] } = () => {
    const p = this.changeableProps();
    const s = this.changeableState();
    const o = this.otherChangeables();
    const outs = this.displayableOutputs();
    // $FlowIssue
    return {
      ...(p.length && { Inputs: p }),
      ...(s.length && { Internals: s }),
      ...(o.length && { Other: o }),
      // $FlowIssue - outputs, i kno TODO
      ...(outs.length && { Outputs: outs }),
    };
  };

  displayableOutputs: () => Displayable[] = () => {
    const schema = this.constructor.schema.output;
    return Object.keys(schema).map(k => ({
      title: k,
      type: schema[k],
      value: get(this.outputCache, k),
    }));
  };

  changeableState: () => Changeable[] = () => {
    const stateSchema = this.constructor.schema.state;
    return Object.keys(stateSchema).map(k => ({
      title: k,
      type: stateSchema[k],
      value: get(this.state, k),
      onChange: val => {
        if (this.state) {
          this.state[k] = val;
        } else {
          // $FlowIssue
          this.state = { [k]: val };
        }
        this.notifyAllOutputs();
      },
    }));
  };

  changeableProps: () => Changeable[] = () => {
    const inputSchema = this.constructor.schema.input;
    return Object.keys(inputSchema).map(k => ({
      title: k,
      type: inputSchema[k],
      value: get(this.props, k),
      onChange: val => {
        const oldProps = this.props ? cloneDeep(this.props) : {};
        if (this.props) {
          this.props[k] = val;
        } else {
          this.props = { [k]: val };
        }
        // $FlowIssue
        this.willReceiveProps(this.props, oldProps, true);
        this.notifyAllOutputs();
      },
    }));
  };

  otherChangeables: () => Changeable[] = () => [];

  pushToState = (
    stateKey: string,
    change: Object,
    exclude: string[] = [],
    setPath: ?string = null
  ): string[] => {
    const partial = this.state[stateKey];
    if (!partial) {
      return [];
    }
    const allKeys = Object.keys(change);
    const keys = exclude.length > 0 ? allKeys.filter(k => !exclude.includes(k)) : allKeys;
    if (keys.length === 0) return [];
    keys.forEach(k => {
      const accept = change[k] !== undefined;
      if (k in partial && accept) {
        if (typeof partial.set === 'function') {
          partial.set(k, change[k]);
        } else {
          set(partial, setPath ? setPath : k, change[k]);
        }
      }
    });
    return keys;
  };

  domId = () => `n-root-${this.id}`;
  domNode = () => document.getElementById(this.domId());

  // Probably should just require display name and not need this
  static nameFrom(clazz: Class<AnyNode>) {
    return clazz.displayName || startCase(clazz.name.replace(/node/i, ''));
  }

  static getRegistryName(): string {
    return this.registryName || this.name;
  }

  signature = (maxLen: number = 0, style: ?Object = null) =>
    // $FlowIgnore
    signatureFor(this.constructor, maxLen, style);

  serialize: (x: number, y: number) => NodeSerialization<$Shape<Val>> = (x, y) => {
    const stateS = this.constructor.schema.state;
    const state = fromPairs(
      Object.keys(this.state)
        .map(k => {
          const type: ?TypeImpl = get(stateS, k);
          if (type && type.serialize) {
            try {
              const serialized = type.serialize(this.state[k]);
              if (serialized !== undefined) {
                return [k, serialized];
              }
            } catch (e) {
              console.error('error parsing', this.state[k], type.name, e);
            }
          }
          return null;
        })
        .filter(p => p)
    );
    const type = this.constructor.getRegistryName();
    return { id: this.id, type, x, y, state, title: this.title };
  };

  static duplicate(node: AnyNode): AnyNode {
    const serial = node.serialize(0, 0);
    serial.id = '';
    return NodeBase.load(serial);
  }

  static +_inKeys: string[];
  static inKeys(): string[] {
    if (this._inKeys) {
      return this._inKeys;
    }
    (this: any)._inKeys = Object.keys(this.schema.input);
    return this._inKeys;
  }

  static +_inKeyIdxMap: { [string]: number };
  static inKeyIndex(key: string): number {
    if (this._inKeyIdxMap) {
      return this._inKeyIdxMap[key];
    }
    (this: any)._inKeyIdxMap = fromPairs(this.inKeys().map((k, i) => [k, i]));
    return this._inKeyIdxMap[key];
  }

  static +_outKeys: string[];
  static outKeys(): string[] {
    if (this._outKeys) {
      return this._outKeys;
    }
    (this: any)._outKeys = Object.keys(this.schema.output);
    return this._outKeys;
  }

  static +_outKeyIdxMap: { [string]: number };
  static outKeyIndex(key: string): number {
    if (this._outKeyIdxMap) {
      return this._outKeyIdxMap[key];
    }
    (this: any)._outKeyIdxMap = fromPairs(this.outKeys().map((k, i) => [k, i]));
    return this._outKeyIdxMap[key];
  }

  static +_displayInKeys: string[];
  static displayInKeys(): string[] {
    if (this._displayInKeys) {
      return this._displayInKeys;
    }
    (this: any)._displayInKeys = Object.keys(this.schema.input).map(k =>
      this.shortNames[k] ? this.shortNames[k] : k
    );
    return this._displayInKeys;
  }

  static +_displayOutKeys: string[];
  static displayOutKeys(): string[] {
    if (this._displayOutKeys) {
      return this._displayOutKeys;
    }
    (this: any)._displayOutKeys = Object.keys(this.schema.output).map(k =>
      this.shortNames[k] ? this.shortNames[k] : k
    );
    return this._displayOutKeys;
  }

  static initializeState(): Object {
    const state = {};
    Object.keys(this.schema.state).forEach(k => {
      state[k] = this.schema.state[k].defaultValue;
    });
    return state;
  }

  static load(json: NodeSerialization<$Shape<Val>>): AnyNode {
    const clazz = window.NodeRegistry[json.type];
    try {
      const title = get(json, 'title');
      return new clazz(json.state, {}, json.id, title);
    } catch (e) {
      console.error('cannot load node', json.type);
      throw e;
    }
  }
}

export type AnyNode = NodeBase<any, any, any>;
export type Schema = { input: TypeMap, output: TypeMap, state: TypeMap };
// TODO - type these two
export type Displayable = { title: string, type: TypeImpl, value: any };
export type Changeable = Displayable & { onChange: (val: any) => void };
export type ChangeListener = AnyNode => void;
export type NodeSerialization<S> = {
  id: string,
  type: string,
  x: number,
  y: number,
  state?: S,
  title?: ?string,
};
