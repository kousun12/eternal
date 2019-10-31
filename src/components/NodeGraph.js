// @flow

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'redux-starter-kit';
import { DraggableCore } from 'react-draggable';
import { get, uniq, throttle, omit, fromPairs, mapValues } from 'lodash';
import Node from './Node';
import Graph from 'models/Graph';
import Edge from 'models/Edge';

import type { DraggableData } from 'react-draggable';
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
  zooms,
} from 'redux/ducks/graph';

import type { NodeInSpace, Pos } from 'types';
import type { AnyNode } from 'models/NodeBase';
import AllEdges from 'components/AllEdges';
import type { PosMemo, SelectedView } from 'redux/ducks/graph';
import { addVec, scaleVec, subVec, unitVec, zero } from 'utils/vector';
import type { Direction } from 'utils/vector';

type OP = {|
  graph: Graph,
  onCreateEdge?: Edge => void,
  onDeleteEdge?: Edge => void,
  onNodeSelect?: AnyNode => void,
  onNodeDeselect?: (AnyNode, ?boolean, ?boolean) => void,
  onNodeSelectionChange?: (?AnyNode, ?number) => void,
  visible: boolean,
|};
type SP = {| selected: { [string]: boolean }, selectCount: number, ...SelectedView |};
type DP = {|
  selSet: (string[]) => void,
  zoomIn: (?Pos) => void,
  zoomOut: (?Pos) => void,
  zoomReset: () => void,
  setPan: Pos => void,
  updatePos: PosMemo => void,
|};

type P = {| ...SP, ...OP, ...DP |};
type S = {|
  source: ?[string, number],
  connecting: boolean,
  mousePos: ?Pos,
  canvasDragEnd: ?Pos,
  metaDown: boolean,
|};

class NodeGraph extends React.Component<P, S> {
  dragOffsets: PosMemo = {};
  canvasDragStart: ?Pos;
  moving: boolean = false;
  deselectNodes: boolean = false;
  timeoutId: ?TimeoutID = null;
  deltaY: number = 0;
  state = { source: null, connecting: false, mousePos: null, canvasDragEnd: null, metaDown: false };

  componentDidMount() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('keydown', this.onKeyDown);
    window.centerP = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    window.addEventListener('resize', this.onWinResize);
    const { graph } = this.props;
    graph && this._setPosFromGraph();
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onWinResize);
    this.timeoutId && clearTimeout(this.timeoutId);
    this._debouncedSetMouse.cancel();
  }

  componentDidUpdate(prev) {
    const { graph, scale } = this.props;
    graph && graph !== prev.graph && this._setPosFromGraph();
    if (prev.scale !== scale && document.body) {
      const size = 250 * (scale * 0.25 + 0.75);
      document.body.style.backgroundSize = `${size}px ${size}px`;
    }
  }

  onKeyUp = (e: KeyboardEvent) => e.key === 'Meta' && this.setState({ metaDown: false });
  onKeyDown = (e: KeyboardEvent) => e.key === 'Meta' && this.setState({ metaDown: true });
  onScroll = (e: WheelEvent) => {
    const { zoom, scale } = this.props;
    this.deltaY += e.deltaY;
    const thresh = 30;
    let txFn = null;
    if (this.deltaY > thresh && zoom < zooms.length - 1) {
      txFn = this.props.zoomIn;
      this.deltaY = 0;
    } else if (this.deltaY < -thresh && zoom > 0) {
      txFn = this.props.zoomOut;
      this.deltaY = 0;
    }
    if (this.deltaY > thresh || this.deltaY < -thresh) {
      this.deltaY = 0;
    }
    if (txFn) {
      const fromCenter = subVec({ x: e.clientX, y: e.clientY }, window.centerP);
      txFn(scaleVec(fromCenter, scale * 0.1 * Math.sign(e.deltaY)));
    }
  };

  onWinResize = () => {
    window.centerP = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  };

  onMouseUp = () => {
    this.timeoutId = setTimeout(() => this.setState({ mousePos: null }), 1);
  };

  onMouseMove = (e: MouseEvent) => {
    if (this.moving) {
      return;
    }
    const { connecting } = this.state;
    const { selectCount } = this.props;
    const set = connecting || selectCount > 0;
    if (!set) {
      return;
    }
    this._debouncedSetMouse(e);
  };

  _debouncedSetMouse = throttle((e: MouseEvent) => {
    this.setState({ mousePos: { x: e.clientX, y: e.clientY } });
  }, 24);

  _getSelected = (): NodeInSpace[] => {
    const { selected, graph } = this.props;
    return graph.nodes.filter(nis => selected[nis.node.id]);
  };

  onNodeStartMove = (started: NodeInSpace, data: DraggableData) => {
    if (!this.props.selected[started.node.id]) {
      this.dragOffsets = { [started.node.id]: zero };
      this.props.selectCount && this.props.selSet([]);
    } else {
      this.dragOffsets = fromPairs(
        this._getSelected()
          .map(nis => [nis.node.id, subVec(started.pos, nis.pos)])
          .concat([[started.node.id, zero]])
      );
    }
    this.moving = true;
  };

  onNodeStopMove = (node: NodeInSpace, data: DraggableData) => {
    this.onNodeMove(node, data);
    const updates = mapValues(this.dragOffsets, offset => subVec(data, offset));
    this._posUpdate(updates);
    this.dragOffsets = {};
    this.moving = false;
  };

  _posUpdate = (updates: PosMemo) => {
    this.props.graph.updatePositions(updates);
    this._setPosFromGraph();
  };

  lastData: ?DraggableData;
  lastUpdateTime: number = performance.now();
  onNodeMove = (node: NodeInSpace, data: DraggableData) => {
    const thresh = 120 * this.props.scaleInverse;
    const timeThresh = this.props.selectCount < 4 ? 16 : this.props.selectCount < 11 ? 30 : 50;
    if (
      !this.lastData ||
      performance.now() - this.lastUpdateTime > timeThresh ||
      Math.abs(this.lastData.x - data.x) > thresh ||
      Math.abs(this.lastData.y - data.y) > thresh
    ) {
      const updates = mapValues(this.dragOffsets, offset => subVec(data, offset));
      this.props.updatePos(updates);
      this.lastUpdateTime = performance.now();
      this.lastData = data;
    }
  };

  onStartConnector = (id: string, outputIndex: number, e: MouseEvent) => {
    this.setState({
      connecting: true,
      source: [id, outputIndex],
      mousePos: { x: e.clientX, y: e.clientY },
    });
  };

  onCompleteConnector = (id: string, inIndex: number) => {
    const { connecting, source } = this.state;
    const { graph } = this.props;
    if (connecting && source) {
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
    this.setState({ connecting: false, mousePos: null });
    this.forceUpdate();
  };

  handleRemoveConnector = (edge: Edge) => {
    if (this.props.onDeleteEdge) {
      this.props.onDeleteEdge(edge);
    }
    this.props.graph.removeEdge(edge);
    this.forceUpdate();
  };

  onNodeSelect = (n: NodeInSpace, idx?: number, resetHighlights?: boolean) => {
    if (this.props.onNodeSelect) {
      this.props.onNodeSelect(n.node);
    }
    const highlighted = resetHighlights
      ? [n.node.id]
      : uniq(Object.keys(this.props.selected).concat(n.node.id));
    if (highlighted.length > 1) {
      this._onNodeChange(null);
    } else {
      this._onNodeChange(n.node, idx);
    }
    this.props.selSet(highlighted);
  };

  onNodeDeselect = (n: NodeInSpace, removeHighlight: boolean, resetOtherHighlights?: boolean) => {
    if (this.props.onNodeDeselect) {
      this.props.onNodeDeselect(n.node);
    }
    this._onNodeChange(null);
    if (removeHighlight || resetOtherHighlights) {
      const highlighted = resetOtherHighlights
        ? removeHighlight
          ? []
          : [n.node.id]
        : Object.keys(omit(this.props.selected, n.node.id));
      this.props.selSet(highlighted);
    }
  };

  onDeleteNode = (n: AnyNode) => {
    this.props.graph.removeNode(n);
    this._setPosFromGraph();
    this._onNodeChange(null);
  };

  _setPosFromGraph = () => this.props.updatePos(this.props.graph.nodePositions());

  _onNodeChange = (n: ?AnyNode, idx?: number) => {
    if (this.props.onNodeSelectionChange) {
      this.props.onNodeSelectionChange(n, idx);
    }
  };

  _overlaps = (r1: ClientRect, r2: ClientRect) =>
    !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);

  _nodesIntersecting = (box: ClientRect): NodeInSpace[] =>
    this.props.graph.nodes.filter(nis => {
      const el = nis.node.domNode();
      return el && this._overlaps(box, el.getBoundingClientRect());
    });

  _setIntersects = throttle((union: boolean, subtract: boolean) => {
    const selBox = document.getElementById('selection-box');
    if (!selBox) {
      return;
    }
    const selBound = selBox.getBoundingClientRect();
    if (selBound.width < 10 && selBound.height < 10) {
      return;
    }
    const { selSet, selected } = this.props;
    const ids = this._nodesIntersecting(selBound).map(nis => nis.node.id);
    selSet(
      union
        ? uniq(Object.keys(selected).concat(ids))
        : subtract
        ? Object.keys(selected).filter(sId => !ids.includes(sId))
        : ids
    );
  }, 30);

  _onCanvasDrag = throttle((e: MouseEvent, data: DraggableData) => {
    if (!this.moving) {
      if (e.metaKey && this.canvasDragStart) {
        this.setState({ canvasDragEnd: data });
        this._setIntersects(e.shiftKey, e.altKey);
      } else if (!e.metaKey) {
        const { setPan, pan, scaleInverse, scale } = this.props;
        const newPan = addVec(pan, scaleVec({ x: data.deltaX, y: data.deltaY }, scaleInverse));
        setPan(newPan);
        if (document.body) {
          document.body.style.backgroundPosition = `${newPan.x * scale}px ${newPan.y * scale}px`;
        }
        this.deselectNodes = false;
      }
    }
  }, 18);

  _onStartCanvasDrag = (e: MouseEvent, data: DraggableData) => {
    if (e.metaKey) {
      this.canvasDragStart = data;
      this.deselectNodes = false;
    } else {
      this.deselectNodes = true;
    }
  };

  _onEndCanvasDrag = (e: MouseEvent, data: DraggableData) => {
    if (this.deselectNodes) {
      this.props.selSet([]);
      this.deselectNodes = false;
    }
    this._clearCanvasDrag();
  };

  render() {
    const { connecting, source, metaDown } = this.state;
    const { visible, selected, scale, pan, graph, scaleInverse } = this.props;
    const selStyle = this._selectionBoxStyle();
    return (
      <DraggableCore
        onDrag={this._onCanvasDrag}
        scale={scale}
        onStart={this._onStartCanvasDrag}
        onStop={this._onEndCanvasDrag}
      >
        <div
          id="graph-root"
          className={this._rootClassName()}
          onWheel={this.onScroll}
          onDoubleClick={this._onCanvasDoubleClick}
          onClick={this._onCanvasClick}
        >
          <div id="graph-scalable" style={this._rootStyle()}>
            {graph.nodes.map((nis, i) => {
              return (
                <Node
                  selected={selected[nis.node.id]}
                  visible={visible}
                  disabled={Boolean(metaDown)}
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
              dragging={connecting}
              source={source}
              visible={visible}
              selected={selected}
              onRemoveConnector={this.handleRemoveConnector}
              pan={pan}
              scaleInverse={scaleInverse}
              graph={graph}
              mousePos={this.state.mousePos}
            />
          </div>
          {selStyle && <div id="selection-box" style={selStyle} />}
        </div>
      </DraggableCore>
    );
  }

  _onCanvasDoubleClick = (e: MouseEvent) => {
    Object.keys(this.props.selected).length && this.props.selSet([]);
    this._clearCanvasDrag();
    this._clearConnecting();
    this.moving = false;
    if (e.metaKey !== this.state.metaDown) {
      this.setState({ metaDown: e.metaKey });
    }
  };

  _onCanvasClick = (e: MouseEvent) => {
    this._clearConnecting();
    this._clearCanvasDrag();
    this.moving = false;
    if (e.metaKey !== this.state.metaDown) {
      this.setState({ metaDown: e.metaKey });
    }
  };

  _clearConnecting = () => {
    this.state.connecting && this.setState({ connecting: false });
  };

  _clearCanvasDrag = () => {
    this.canvasDragStart = null;
    this.state.canvasDragEnd && this.setState({ canvasDragEnd: null });
  };

  _rootStyle = () => ({ transform: `scale(${this.props.scale})` });

  _rootClassName = () =>
    this.state.connecting
      ? 'dragging'
      : this.canvasDragStart || this.state.metaDown
      ? 'selecting'
      : this.moving
      ? 'moving-node'
      : '';

  _selectionBoxStyle = () => {
    const {
      canvasDragStart,
      state: { canvasDragEnd },
    } = this;
    if (!canvasDragEnd || !canvasDragStart) {
      return;
    }
    const selCoord = subVec(canvasDragEnd, canvasDragStart);
    return {
      width: Math.abs(selCoord.x),
      height: Math.abs(selCoord.y),
      top: Math.min(canvasDragStart.y, canvasDragEnd.y),
      left: Math.min(canvasDragStart.x, canvasDragEnd.x),
    };
  };

  _onCopy = () => {
    const selected = this.props.graph.duplicate(this._getSelected()).map(nis => nis.node.id);
    this.props.selSet(selected);
  };

  _vAlign = () => {
    const selected = this._getSelected();
    if (selected.length < 2) {
      return;
    }
    const x = selected[0].pos.x;
    const updates = fromPairs(selected.map(nis => [nis.node.id, { ...nis.pos, x }]));
    this._posUpdate(updates);
  };

  _hAlign = () => {
    const selected = this._getSelected();
    if (selected.length < 2) {
      return;
    }
    const y = selected[0].pos.y;
    const updates = fromPairs(selected.map(nis => [nis.node.id, { ...nis.pos, y }]));
    this._posUpdate(updates);
  };

  _autoFmt = () => {
    const selected = this._getSelected();
    let set = [];
    let buffer = 24;
    if (selected.length < 2) {
      set = this.props.graph.nodes;
    } else {
      set = selected;
      buffer = 60;
    }
    if (set.length < 2) {
      return;
    }
    const byId = fromPairs(set.map(nis => [nis.node.id, nis]));
    let next = get(set, [0, 'node', 'id']);
    const groups = [];
    while (next) {
      const nis = byId[next];
      delete byId[next];
      const group = [nis];
      for (const id in byId) {
        if (byId[id] && Math.abs(byId[id].pos.x - nis.pos.x) < buffer) {
          group.push(byId[id]);
          delete byId[id];
        }
      }
      groups.push(group);
      const ids = Object.keys(byId);
      if (ids.length) {
        next = ids[0];
      } else {
        next = undefined;
      }
    }
    const updates = {};
    for (const group of groups) {
      const x = group[0].pos.x;
      group.forEach(nis => {
        updates[nis.node.id] = { ...nis.pos, x };
      });
    }
    Object.keys(updates).length && this._posUpdate(updates);
  };

  _selectAll = () => this.props.selSet(this.props.graph.nodeIds());

  _pan = throttle((dir: Direction) => {
    const { setPan, pan, scaleInverse } = this.props;
    setPan(addVec(pan, scaleVec(unitVec(dir), scaleInverse * 20)));
  }, 60);

  _panR = () => this._pan('right');
  _panL = () => this._pan('left');
  _panD = () => this._pan('down');
  _panU = () => this._pan('up');

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    const { selectCount, zoomIn, zoomOut, zoomReset } = this.props;
    const multi = selectCount > 0;
    return (
      <Hotkeys>
        {multi && (
          <Hotkey
            group="Node Actions"
            combo="shift + meta + c"
            label="Duplicate node(s)"
            global
            onKeyDown={this._onCopy}
            preventDefault
          />
        )}
        {multi && (
          <Hotkey
            group="Node Actions"
            combo="h"
            label="Horizontal align"
            global
            onKeyDown={this._hAlign}
          />
        )}
        {multi && (
          <Hotkey
            group="Node Actions"
            combo="v"
            label="Vertical align"
            global
            onKeyDown={this._vAlign}
          />
        )}
        <Hotkey
          group="Node Actions"
          combo="meta + alt + l"
          label={`Auto-format ${selectCount < 2 ? 'all' : 'selected'}`}
          global
          onKeyDown={this._autoFmt}
          preventDefault
        />
        <Hotkey global combo="alt + =" label="Zoom in" onKeyDown={zoomIn} group="View" />
        <Hotkey global combo="alt + -" label="Zoom out" onKeyDown={zoomOut} group="View" />
        <Hotkey global combo="alt + 0" label="Home view" onKeyDown={zoomReset} group="View" />
        <Hotkey global combo="right" label="Pan right" onKeyDown={this._panR} group="View" />
        <Hotkey global combo="left" label="Pan left" onKeyDown={this._panL} group="View" />
        <Hotkey global combo="down" label="Pan down" onKeyDown={this._panD} group="View" />
        <Hotkey global combo="up" label="Pan up" onKeyDown={this._panU} group="View" />

        <Hotkey
          global
          combo="shift + meta + a"
          label="Select all"
          onKeyDown={this._selectAll}
          group="Selection"
        />
        <Hotkey global combo="meta + drag" label="Select area" group="Selection" />
        <Hotkey global combo="meta + alt + drag" label="Subtract selection" group="Selection" />
        <Hotkey global combo="meta + shift + drag" label="Add selection" group="Selection" />
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
  zoomIn: (pan?: Pos) => d(_zIn(pan)),
  zoomOut: (pan?: Pos) => d(_zOut(pan)),
  zoomReset: () => d(_zReset()),
  setPan: (pos: Pos) => d(_setPan(pos)),
  updatePos: (pos: PosMemo) => d(_updatePos(pos)),
});

export default connect(
  select,
  dispatch
)(HotkeysTarget(NodeGraph));
