// @flow

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'redux-starter-kit';
import { DraggableCore } from 'react-draggable';
import { get, uniq, throttle, omit, fromPairs } from 'lodash';
import Node from './Node';
import Graph from 'models/Graph';
import Edge from 'models/Edge';

import { DraggableData } from 'react-draggable';
import { Hotkey, Hotkeys, HotkeysTarget } from '@blueprintjs/core';
import {
  selectedS,
  selectView,
  selSet as _selSet,
  zoomIn as _zIn,
  zoomOut as _zOut,
  zoomReset as _zReset,
  setPan as _setPan,
} from 'redux/ducks/graph';

import type { NodeInSpace, Pos } from 'types';
import type { AnyNode } from 'models/NodeBase';
import AllEdges from 'components/AllEdges';
import type { SelectedView } from 'redux/ducks/graph';
import { addVec, scaleVec, subVec, unitVec } from 'utils/vector';
import type { Direction } from 'utils/vector';

type OP = {|
  graph: Graph,
  onCreateEdge?: Edge => void,
  onDeleteEdge?: Edge => void,
  onNodeSelect?: AnyNode => void,
  onNodeDeselect?: (AnyNode, ?boolean) => void,
  onNodeSelectionChange?: (?AnyNode, ?number) => void,
  visible: boolean,
|};
type SP = {| selected: { [string]: boolean }, selectCount: number, ...SelectedView |};
type DP = {|
  selSet: (string[]) => void,
  zoomIn: () => void,
  zoomOut: () => void,
  zoomReset: () => void,
  setPan: Pos => void,
|};

type P = {| ...SP, ...OP, ...DP |};
type S = {|
  nodes: NodeInSpace[],
  source: ?[string, number],
  dragging: boolean,
  mousePos: ?Pos,
|};

type DragDirective = {| nis: NodeInSpace, offset: Pos |};

class NodeGraph extends React.Component<P, S> {
  dragDirectives: { [string]: DragDirective } = {};
  moving: boolean = false;
  timeoutId: ?TimeoutID = null;
  deltaY: number = 0;
  constructor(props: P) {
    super(props);
    this.state = { nodes: props.graph.nodes, source: null, mousePos: null, dragging: false };
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    this.onMouseMove.cancel();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.timeoutId && clearTimeout(this.timeoutId);
  }

  componentWillReceiveProps(nextProps: $ReadOnly<P>) {
    if (this.props.graph !== nextProps.graph) {
      this.setState({ nodes: nextProps.graph.nodes });
    }
  }

  onScroll = (e: WheelEvent) => {
    this.deltaY += e.deltaY;
    const thresh = 20;
    if (this.deltaY > thresh) {
      this.props.zoomIn();
      this.deltaY = 0;
    } else if (this.deltaY < -thresh) {
      this.props.zoomOut();
      this.deltaY = 0;
    }
  };

  onMouseUp = () => {
    this.timeoutId = setTimeout(() => this.setState({ dragging: false }), 1);
  };

  onMouseMove = throttle((e: MouseEvent) => {
    const { dragging, mousePos } = this.state;
    const { selectCount } = this.props;
    const set = !mousePos || dragging || selectCount > 0;
    if (this.moving) {
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
    this.moving = true;
  };

  onNodeStopMove = (node: NodeInSpace, data: DraggableData) => {
    this.onNodeMove(node, data);
    const nodes = this.state.nodes.map(n => get(this.dragDirectives, [n.node.id, 'nis'], n));
    this.props.graph.setNodes(nodes);
    this.dragDirectives = {};
    this.moving = false;
  };

  onNodeMove = (node: NodeInSpace, data: DraggableData) => {
    // $FlowIgnore
    const vals: DragDirective[] = Object.values(this.dragDirectives);
    if (vals.length > 1) {
      vals.forEach(d => {
        if (this.props.selected[d.nis.node.id]) {
          d.nis.pos = subVec(data, d.offset);
        }
      });
    }
    const nodes = this.state.nodes.map(n => get(this.dragDirectives, [n.node.id, 'nis'], n));
    this.setState({ nodes });
  };

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

  onNodeSelect = (n: NodeInSpace, idx?: number) => {
    if (this.props.onNodeSelect) {
      this.props.onNodeSelect(n.node);
    }
    const highlighted = uniq(Object.keys(this.props.selected).concat(n.node.id));
    if (highlighted.length > 1) {
      this._onNodeChange(null);
    } else {
      this._onNodeChange(n.node, idx);
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

  _onNodeChange = (n: ?AnyNode, idx?: number) => {
    if (this.props.onNodeSelectionChange) {
      this.props.onNodeSelectionChange(n, idx);
    }
  };

  _onCanvasDrag = (e: Event, data: DraggableData) => {
    if (!this.moving) {
      const { setPan, pan, scale } = this.props;
      setPan(addVec(pan, scaleVec({ x: data.deltaX, y: data.deltaY }, 1 / scale)));
    }
  };

  render() {
    const { nodes, dragging, source, mousePos } = this.state;
    const { visible, selected, scale, pan, graph } = this.props;
    return (
      <DraggableCore
        onDrag={this._onCanvasDrag}
        scale={scale}
      >
        <div id='graph-root' className={(dragging ? 'dragging' : '')} onWheel={this.onScroll}>
          <div className="graph-scalable" style={this._rootStyle()}>
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
                  onNodeMove={this.onNodeMove}
                  onStartConnector={this.onStartConnector}
                  onCompleteConnector={this.onCompleteConnector}
                  onNodeSelect={this.onNodeSelect}
                  onNodeDeselect={this.onNodeDeselect}
                  onDelete={this.onDeleteNode}
                  scale={scale}
                  positionOffset={pan}
                />
              );
            })}
            <AllEdges
              edges={get(graph, 'edges', [])}
              nodes={nodes}
              mousePos={mousePos}
              dragging={dragging}
              source={source}
              visible={visible}
              selected={selected}
              onRemoveConnector={this.handleRemoveConnector}
              pan={pan}
            />
          </div>
        </div>
      </DraggableCore>
    );
  }

  _rootStyle = () => {
    return { transform: `scale(${this.props.scale})` };
  };

  _onCopy = () => {
    const selected = this.props.graph.duplicate(this._getSelected()).map(nis => nis.node.id);
    this.props.selSet(selected);
  };

  _selectAll = () => this.props.selSet(this.state.nodes.map(nis => nis.node.id));

  _pan = (dir: Direction) => {
    const { setPan, pan, scale } = this.props;
    const move = scaleVec(unitVec(dir), (1 / scale) * 30);
    setPan(addVec(pan, move));
  };

  _panR = () => this._pan('right');
  _panL = () => this._pan('left');
  _panD = () => this._pan('down');
  _panU = () => this._pan('up');

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    const { selectCount, zoomIn, zoomOut, zoomReset } = this.props;
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
        <Hotkey global combo="alt + =" label="Zoom in" onKeyDown={zoomIn} group="View" />
        <Hotkey global combo="alt + -" label="Zoom out" onKeyDown={zoomOut} group="View" />
        <Hotkey global combo="alt + 0" label="Zoom reset" onKeyDown={zoomReset} group="View" />
        <Hotkey global combo="right" label="Pan right" onKeyDown={this._panR} group="View" />
        <Hotkey global combo="left" label="Pan left" onKeyDown={this._panL} group="View" />
        <Hotkey global combo="down" label="Pan down" onKeyDown={this._panD} group="View" />
        <Hotkey global combo="up" label="Pan up" onKeyDown={this._panU} group="View" />
      </Hotkeys>
    );
  }
}

const select = createSelector(
  [selectedS, selectView],
  (selected, view) => ({ ...selected, ...view })
);
const dispatch = d => ({
  selSet: id => d(_selSet(id)),
  zoomIn: () => d(_zIn()),
  zoomOut: () => d(_zOut()),
  zoomReset: () => d(_zReset()),
  setPan: (pos: Pos) => d(_setPan(pos)),
});

export default connect(
  select,
  dispatch
)(HotkeysTarget(NodeGraph));
