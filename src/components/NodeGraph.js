// @flow

import React from 'react';
import { connect } from 'react-redux';
import { get, uniq, throttle, omit, fromPairs } from 'lodash';
import Node from './Node';
import Graph from 'models/Graph';
import Edge from 'models/Edge';

import { DraggableData } from 'react-draggable';
import { Hotkey, Hotkeys, HotkeysTarget } from '@blueprintjs/core';
import { selectedS, selSet as _selSet } from 'redux/ducks/graph';

import type { NodeInSpace, Pos } from 'types';
import type { AnyNode } from 'models/NodeBase';
import AllEdges from 'components/AllEdges';

type OP = {|
  graph: Graph,
  onCreateEdge?: Edge => void,
  onDeleteEdge?: Edge => void,
  onNodeSelect?: AnyNode => void,
  onNodeDeselect?: (AnyNode, ?boolean) => void,
  onNodeSelectionChange?: (?AnyNode) => void,
  visible: boolean,
|};
type SP = {| selected: { [string]: boolean }, selectCount: number |};
type DP = {| selSet: (string[]) => void |};
type P = {| ...SP, ...OP, ...DP |};

type S = {|
  nodes: NodeInSpace[],
  source: ?[string, number],
  dragging: boolean,
  mousePos: ?Pos,
  moving: boolean,
|};

type DragDirective = {
  nis: NodeInSpace,
  offset: Pos,
};

class NodeGraph extends React.Component<P, S> {
  dragDirectives: { [string]: DragDirective } = {};
  constructor(props: P) {
    super(props);
    this.state = {
      nodes: props.graph.nodes,
      source: null,
      mousePos: null,
      dragging: false,
      moving: false,
    };
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    this.onMouseMove.cancel();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  componentWillReceiveProps(nextProps: $ReadOnly<P>) {
    if (this.props.graph !== nextProps.graph) {
      this.setState({ nodes: nextProps.graph.nodes });
    }
  }

  onMouseUp = () => {
    setTimeout(() => this.setState({ dragging: false }), 1);
  };

  onMouseMove = throttle((e: MouseEvent) => {
    const { dragging, mousePos, moving } = this.state;
    const { selectCount } = this.props;
    const set = !mousePos || dragging || selectCount > 0;
    if (moving) {
      return;
    }
    if (!set) return;
    e.stopPropagation();
    e.preventDefault();
    this.setState({ mousePos: { x: e.clientX, y: e.clientY } });
  }, 18);

  _getSelected = (): NodeInSpace[] => {
    const { selected } = this.props;
    return this.state.nodes.filter(nis => selected[nis.node.id]);
  };

  onNodeStartMove = (started: NodeInSpace, data: DraggableData) => {
    this.dragDirectives = fromPairs(
      this._getSelected().map(nis => [
        nis.node.id,
        {
          nis,
          offset: { x: started.pos.x - nis.pos.x, y: started.pos.y - nis.pos.y },
        },
      ])
    );
    this.setState({ moving: true });
  };

  onNodeStopMove = (node: NodeInSpace, data: DraggableData) => {
    this.onNodeMove(node, data);
    const nodes = this.state.nodes.map(n => get(this.dragDirectives, [n.node.id, 'nis'], n));
    this.props.graph.setNodes(nodes);
    this.dragDirectives = {};
    this.setState({ moving: false });
  };

  onNodeMove = (node: NodeInSpace, data: DraggableData) => {
    // $FlowIgnore
    const vals: DragDirective[] = Object.values(this.dragDirectives);
    if (vals.length > 1) {
      vals.forEach(d => {
        if (this.props.selected[d.nis.node.id]) {
          d.nis.pos = { x: data.x - d.offset.x, y: data.y - d.offset.y };
        }
      });
    }
    const nodes = this.state.nodes.map(n => get(this.dragDirectives, [n.node.id, 'nis'], n));
    this.setState({ nodes });
  };

  _onNodeMoveT = throttle(this.onNodeMove, 20);

  onStartConnector = (id: string, outputIndex: number) => {
    const mousePos = get(window, 'event.clientX')
      ? { x: window.event.clientX, y: window.event.clientY }
      : this.state.mousePos;
    this.setState({ mousePos, dragging: true, source: [id, outputIndex] });
  };

  onCompleteConnector = (id: string, inIndex: number) => {
    const { dragging, source } = this.state;
    const { graph } = this.props;
    if (dragging && source) {
      const [nodeId, outIdx] = source;
      let fromNode = graph.nodeWithId(nodeId);
      let toNode = graph.nodeWithId(id);
      if (fromNode && toNode) {
        let fromAttr = fromNode.node.outKeyAt(outIdx);
        let toAttr = toNode.node.inKeyAt(inIndex);
        const edge = new Edge(fromNode.node, toNode.node, fromAttr, toAttr);
        graph.addEdge(edge);
        this.props.onCreateEdge && this.props.onCreateEdge(edge);
      }
    }
    this.setState({ dragging: false });
    this.forceUpdate();
  };

  handleRemoveConnector = (edge: Edge) => {
    if (this.props.onDeleteEdge) {
      this.props.onDeleteEdge(edge);
    }
    this.props.graph.removeEdge(edge);
    this.forceUpdate();
  };

  onNodeSelect = (n: NodeInSpace) => {
    if (this.props.onNodeSelect) {
      this.props.onNodeSelect(n.node);
    }
    this._onNodeChange(n.node);
    const highlighted = uniq(Object.keys(this.props.selected).concat(n.node.id));
    if (highlighted.length > 1) {
      this._onNodeChange(null);
    }
    this.props.selSet(highlighted);
  };

  onNodeDeselect = (n: NodeInSpace, all?: boolean) => {
    if (this.props.onNodeDeselect) {
      this.props.onNodeDeselect(n.node);
    }
    const highlighted = all ? [] : Object.keys(omit(this.props.selected, n.node.id));
    this._onNodeChange(null);
    this.props.selSet(highlighted);
  };

  onDeleteNode = (n: AnyNode) => {
    this.props.graph.removeNode(n);
    this.setState({ nodes: this.props.graph.nodes });
    this._onNodeChange(null);
  };

  _onNodeChange = (n: ?AnyNode) => {
    if (this.props.onNodeSelectionChange) {
      this.props.onNodeSelectionChange(n);
    }
  };

  resetSize = () => {
    const maxW = Math.max(...this.state.nodes.map(nis => nis.pos.x));
    const maxH = Math.max(...this.state.nodes.map(nis => nis.pos.y));
    const elem = document.getElementById('eternal-root');
    if (elem) {
      elem.style.width = String(maxW + 300);
      elem.style.height = String(maxH + 500);
    }
  };

  _drawEdges = () => {
    const { nodes, mousePos, dragging, source } = this.state;
    const { visible, selected, graph } = this.props;
    return (
      <AllEdges
        edges={get(graph, 'edges', [])}
        nodes={nodes}
        mousePos={mousePos}
        dragging={dragging}
        source={source}
        visible={visible}
        selected={selected}
        onRemoveConnector={this.handleRemoveConnector}
      />
    );
  };

  render() {
    const { nodes, dragging } = this.state;
    const { visible, selected } = this.props;
    return (
      <div className={(dragging ? 'dragging' : '') + ' graph-root'}>
        {nodes.map((nis, i) => {
          return (
            <Node
              selected={selected[nis.node.id]}
              visible={visible}
              pos={nis.pos}
              index={i}
              nis={nis}
              key={`node-${nis.node.id}`}
              onNodeStart={this.onNodeStartMove}
              onNodeStop={this.onNodeStopMove}
              onNodeMove={this._onNodeMoveT}
              onStartConnector={this.onStartConnector}
              onCompleteConnector={this.onCompleteConnector}
              onNodeSelect={this.onNodeSelect}
              onNodeDeselect={this.onNodeDeselect}
              onDelete={this.onDeleteNode}
            />
          );
        })}
        {this._drawEdges()}
      </div>
    );
  }

  _onCopy = () => {
    const selected = this.props.graph.duplicate(this._getSelected()).map(nis => nis.node.id);
    this.props.selSet(selected);
  };

  _selectAll = () => {
    this.props.selSet(this.state.nodes.map(nis => nis.node.id));
  };

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    const { selectCount } = this.props;
    const showCopy = selectCount > 0;
    return (
      <Hotkeys>
        {showCopy && (
          <Hotkey
            group="Node Actions"
            combo="meta + c"
            label="Duplicate Node(s)"
            global={true}
            onKeyDown={this._onCopy}
          />
        )}
        <Hotkey global combo="shift + meta + a" label="Select All" onKeyDown={this._selectAll} />
      </Hotkeys>
    );
  }
}

const dispatch = d => ({ selSet: id => d(_selSet(id)) });

export default connect(
  selectedS,
  dispatch
)(HotkeysTarget(NodeGraph));
