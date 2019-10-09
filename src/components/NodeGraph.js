// @flow

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'redux-starter-kit';
import { DraggableCore } from 'react-draggable';
import { get, uniq, throttle, omit, fromPairs, mapValues } from 'lodash';
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
  updatePos as _updatePos,
} from 'redux/ducks/graph';

import type { NodeInSpace, Pos } from 'types';
import type { AnyNode } from 'models/NodeBase';
import AllEdges from 'components/AllEdges';
import type { PosMemo, SelectedView } from 'redux/ducks/graph';
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
  updatePos: PosMemo => void,
|};

type P = {| ...SP, ...OP, ...DP |};
type S = {|
  source: ?[string, number],
  dragging: boolean,
  mousePos: ?Pos,
|};

class NodeGraph extends React.Component<P, S> {
  dragOffsets: PosMemo = {};
  moving: boolean = false;
  timeoutId: ?TimeoutID = null;
  deltaY: number = 0;
  state = { source: null, mousePos: null, dragging: false };

  componentDidMount() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    const { graph } = this.props;
    graph && this._setPosFromGraph();
  }

  componentWillUnmount() {
    this.onMouseMove.cancel();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.timeoutId && clearTimeout(this.timeoutId);
  }

  componentDidUpdate(prevProps) {
    const { graph } = this.props;
    graph && graph !== prevProps.graph && this._setPosFromGraph();
  }

  onScroll = (e: WheelEvent) => {
    this.deltaY += e.deltaY;
    const thresh = 30;
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

  onMouseMove = (e: MouseEvent) => {
    if (this.moving) {
      return;
    }
    const { dragging, mousePos } = this.state;
    const { selectCount } = this.props;
    const set = !mousePos || dragging || selectCount > 0;
    if (!set) {
      return;
    }
    this._debouncedSetMouse(e);
  };

  _debouncedSetMouse = throttle((e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    this.setState({ mousePos: { x: e.clientX, y: e.clientY } });
  }, 20);

  _getSelected = (): NodeInSpace[] => {
    const { selected, graph } = this.props;
    return graph.nodes.filter(nis => selected[nis.node.id]);
  };

  onNodeStartMove = (started: NodeInSpace) => {
    this.dragOffsets = fromPairs(
      this._getSelected()
        .map(nis => [nis.node.id, subVec(started.pos, nis.pos)])
        .concat([[started.node.id, { x: 0, y: 0 }]])
    );
    this.moving = true;
  };

  onNodeStopMove = (node: NodeInSpace, data: DraggableData) => {
    this.onNodeMove(node, data);
    const { graph } = this.props;
    const updates = mapValues(this.dragOffsets, offset => subVec(data, offset));
    graph.updatePositions(updates);
    this._setPosFromGraph();
    this.dragOffsets = {};
    this.moving = false;
  };

  onNodeMove = (node: NodeInSpace, data: DraggableData) => {
    const updates = mapValues(this.dragOffsets, offset => subVec(data, offset));
    this.props.updatePos(updates);
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
    this._setPosFromGraph();
    this._onNodeChange(null);
  };

  _setPosFromGraph = () => {
    this.props.updatePos(this.props.graph.nodePositions());
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
    const { dragging, source, mousePos } = this.state;
    const { visible, selected, scale, pan, graph } = this.props;
    return (
      <DraggableCore onDrag={this._onCanvasDrag} scale={scale}>
        <div id="graph-root" className={dragging ? 'dragging' : ''} onWheel={this.onScroll}>
          <div className="graph-scalable" style={this._rootStyle()}>
            {graph.nodes.map((nis, i) => {
              return (
                <Node
                  selected={selected[nis.node.id]}
                  visible={visible}
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
              mousePos={mousePos}
              dragging={dragging}
              source={source}
              visible={visible}
              selected={selected}
              onRemoveConnector={this.handleRemoveConnector}
              pan={pan}
              graph={graph}
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

  _selectAll = () => this.props.selSet(this.props.graph.nodeIds());

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
  updatePos: (pos: PosMemo) => d(_updatePos(pos)),
});

export default connect(
  select,
  dispatch
)(HotkeysTarget(NodeGraph));
