// @flow

import React from 'react';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { createSelector } from 'redux-starter-kit';
import onClickOutside from 'react-onclickoutside';
import Draggable, { type DraggableEventHandler, type DraggableData } from 'react-draggable';
import NodeInputList from './NodeInputList';
import NodeOutputList from './NodeOutputList';
import type { AnyNode } from 'models/NodeBase';
import type { NodeInSpace, Pos } from 'types';
import { Hotkey, Hotkeys, HotkeysTarget } from '@blueprintjs/core';
import { selectPositions, selectInfoOpen } from 'redux/ducks/graph';

type SP = {| pos: Pos, infoShowing: boolean |};
type OP = {|
  index: number,
  nis: NodeInSpace,
  onNodeStart: (NodeInSpace, DraggableData) => void,
  onNodeStop: (NodeInSpace, DraggableData) => void,
  onNodeMove: (NodeInSpace, DraggableData) => void,
  onStartConnector: (string, number) => void,
  onCompleteConnector: (string, number) => void,
  onNodeSelect?: (NodeInSpace, ?number) => void,
  onNodeDeselect?: (NodeInSpace, boolean) => void,
  onDelete?: AnyNode => void,
  visible: boolean,
  selected: boolean,
  scale?: ?number,
  positionOffset?: Pos | typeof undefined,
|};
type P = {| ...SP, ...OP |};
const MoveBufferPx = 4;

class Node extends React.Component<P> {
  dragStart: ?Pos;

  _onDelete = () => {
    this.props.onDelete && this.props.onDelete(this.props.nis.node);
  };

  handleDragStart = (event, data: DraggableData) => {
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.props.onNodeStart(this.props.nis, data);
  };

  handleDragStop: DraggableEventHandler = (event, data: DraggableData) => {
    this.props.onNodeStop(this.props.nis, data);
    setTimeout(() => {
      this.dragStart = null;
    });
  };

  handleDrag = (event, data: DraggableData) => {
    this.props.onNodeMove(this.props.nis, data);
  };

  onStartConnector = index => {
    this.props.onStartConnector(this.props.nis.node.id, index);
  };

  onCompleteConnector = index => {
    this.props.onCompleteConnector(this.props.nis.node.id, index);
    this.forceUpdate();
  };

  _selectNode = () => {
    if (this.props.onNodeSelect) {
      this.props.onNodeSelect(this.props.nis, this.props.index);
    }
  };

  _deselectNode = () => {
    if (this.props.onNodeDeselect) {
      this.props.onNodeDeselect(this.props.nis, false);
    }
  };

  handleClick = () => {
    const x = get(this.dragStart, 'x');
    const y = get(this.dragStart, 'y');
    const wx = get(window, 'event.clientX');
    const wy = get(window, 'event.clientY');
    if (
      x &&
      y &&
      wx &&
      wy &&
      (Math.abs(wx - x) > MoveBufferPx || Math.abs(wy - y) > MoveBufferPx)
    ) {
      return;
    }
    if (!this.props.selected) {
      this._selectNode();
    } else {
      this._deselectNode();
    }
  };

  // noinspection JSUnusedGlobalSymbols
  handleClickOutside = event => {
    const { selected, infoShowing } = this.props;
    const ignore = !selected && !infoShowing;
    if (event.metaKey || event.shiftKey || ignore) {
      return;
    }
    if (this.props.onNodeDeselect) {
      this.props.onNodeDeselect(this.props.nis, true);
    }
  };

  render() {
    const { selected, infoShowing, visible, pos, scale, positionOffset } = this.props;
    const { node } = this.props.nis;
    const sel = infoShowing ? 'in-view' : selected ? 'selected' : '';
    let nodeClass = 'node' + (sel ? ` ${sel} ignore-react-onclickoutside` : '');
    if (!visible) {
      return null;
    }

    const name = node.name();
    return (
      <Draggable
        position={pos}
        handle=".node"
        onStart={this.handleDragStart}
        onStop={this.handleDragStop}
        onDrag={this.handleDrag}
        scale={scale || 1}
        positionOffset={positionOffset}
      >
        <div className={nodeClass} onClick={this.handleClick} onDoubleClick={this._selectNode}>
          <header className="node-header">
            <span className="node-title">{name}</span>
          </header>
          <div className="node-content">
            <NodeInputList
              connected={node.connectedInputKeys()}
              items={node.inKeys()}
              display={node.constructor.displayInKeys()}
              onCompleteConnector={this.onCompleteConnector}
            />
            <NodeOutputList
              connected={node.connectedOutputKeys()}
              items={node.outKeys()}
              display={node.constructor.displayOutKeys()}
              onStartConnector={this.onStartConnector}
            />
          </div>
        </div>
      </Draggable>
    );
  }

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    const show = this.props.selected || this.props.infoShowing;
    if (!show) {
      return <Hotkeys />;
    }
    return (
      <Hotkeys>
        <Hotkey
          group="Node Actions"
          combo="backspace"
          label="Delete selected node"
          global={true}
          onKeyDown={this._onDelete}
        />
      </Hotkeys>
    );
  }
}

const getInfoShowing = (s, op) => Boolean(s.graph.infoOpen === op.nis.node.id);
const getPos = (s, op) => s.graph.nodePos[op.nis.node.id];

const makeSelectCreator = () => {
  return createSelector(
    [getPos, getInfoShowing],
    (pos, infoShowing) => ({ pos, infoShowing })
  );
};

const makeSelect = () => {
  const selector = makeSelectCreator();
  const select = (s, op) => selector(s, op);
  return select;
};

export default connect(makeSelect)(onClickOutside(HotkeysTarget(Node)));
