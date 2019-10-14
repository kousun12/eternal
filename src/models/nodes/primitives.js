// @flow
import NodeBase from 'models/NodeBase';
import { TypeImpl } from 'models/AttributeType';
const Types = window.Types;

type S = { value: any };
type O = { out: any };

const [number, string, boolean, date] = ['number', 'string', 'boolean', 'date']
  .map(n => Types[n])
  .map(
    (_t: TypeImpl) =>
      class _PrimNode extends NodeBase<S, null, O> {
        static defaultState = { value: _t.defaultValue };
        static displayName = _t.name;
        static registryName = _t.name;
        static isPrimitive = true;
        static schema = { input: {}, output: { out: _t }, state: { value: _t } };
        process = () => {
          const out = _t.serialize ? _t.serialize(this.state.value) : this.state.value;
          return { out };
        };
      }
  );

export { number, string, boolean, date };
