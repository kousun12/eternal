// @flow
import NodeBase from 'models/NodeBase';
const Types = window.Types;

type S = { map: Object | (any => any) };
type P = { input: any };
type O = { out: any };

export default class MapperNode extends NodeBase<S, P, O> {
  static displayName = 'Mapper';
  static +registryName = 'MapperNode';
  static defaultState = { map: {} };
  static schema = { input: { input: Types.object }, output: { out: Types.object }, state: {} };

  process = () => {
    const { map } = this.state;
    const { input } = this.props;
    const out = typeof map === 'object' ? map[input] : map(input);
    return { out };
  };

  onInputChange = () => {
    return this.outKeys();
  };
}
