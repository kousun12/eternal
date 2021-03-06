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
import { addVec } from 'utils/vector';
import { truncate } from 'utils/string';
import EditInput from 'components/EditInput';

type SP = {| pos: Pos, infoShowing: boolean |};
type OP = {|
  index: number,
  nis: NodeInSpace,
  onNodeStart: (NodeInSpace, DraggableData) => void,
  onNodeStop: (NodeInSpace, DraggableData) => void,
  onNodeMove: (NodeInSpace, DraggableData) => void,
  onStartConnector: (string, number, e: MouseEvent, d: DraggableData) => void,
  onCompleteConnector: (string, number) => void,
  onNodeSelect?: (NodeInSpace, ?number, ?boolean) => void,
  onNodeDeselect?: (NodeInSpace, boolean, ?boolean) => void,
  onDelete?: AnyNode => void,
  visible: boolean,
  selected: boolean,
  scale?: ?number,
  positionOffset?: Pos | typeof undefined,
  disabled: boolean,
|};
type P = {| ...SP, ...OP |};
type S = { loading: boolean, renaming: boolean };
const MoveBufferPx = 4;

class Node extends React.PureComponent<P, S> {
  state = { loading: false, renaming: false };
  dragStart: ?Pos;

  componentDidMount() {
    if (this.state.loading !== this.props.nis.node.isLoading) {
      this.setState({ loading: this.props.nis.node.isLoading });
    }
    this.props.nis.node.setLoadStateListener(loading => this.setState({ loading }));
  }

  componentDidUpdate(prevProps: P) {
    if (prevProps.nis.node.id !== this.props.nis.node.id) {
      prevProps.nis.node.setLoadStateListener(null);
      if (this.state.loading !== this.props.nis.node.isLoading) {
        this.setState({ loading: this.props.nis.node.isLoading });
      }
      this.props.nis.node.setLoadStateListener(loading => this.setState({ loading }));
    }
  }

  componentWillUnmount() {
    this.props.nis.node.setLoadStateListener(null);
  }

  _onDelete = () => this.props.onDelete && this.props.onDelete(this.props.nis.node);

  handleDragStart = (event: MouseEvent, data: DraggableData) => {
    event.stopPropagation();
    if (event.metaKey || event.shiftKey) {
      return;
    }
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.props.onNodeStart(this.props.nis, data);
  };

  handleDragStop: DraggableEventHandler = (event: MouseEvent, data: DraggableData) => {
    event.stopPropagation();
    this.props.onNodeStop(this.props.nis, data);
    setTimeout(() => {
      this.dragStart = null;
    });
  };

  handleDrag = (event: MouseEvent, data: DraggableData) => {
    event.stopPropagation();
    !event.metaKey && this.props.onNodeMove(this.props.nis, data);
  };

  onStartConnector = (i: number, e: MouseEvent, d: DraggableData) =>
    this.props.onStartConnector(this.props.nis.node.id, i, e, d);

  onCompleteConnector = index => {
    this.props.onCompleteConnector(this.props.nis.node.id, index);
    this.forceUpdate();
  };

  _selectNode = (resetHighlights?: boolean) =>
    this.props.onNodeSelect &&
    this.props.onNodeSelect(this.props.nis, this.props.index, resetHighlights);

  _selectNodeWithResets = () => this._selectNode(true);

  _deselectNode = (removeHighlight: boolean, resetOtherHighlights: boolean) => {
    if (this.props.onNodeDeselect) {
      this.props.onNodeDeselect(this.props.nis, removeHighlight, resetOtherHighlights);
    }
  };

  handleClick = (event: MouseEvent) => {
    const x = get(this.dragStart, 'x');
    const y = get(this.dragStart, 'y');
    if (
      x &&
      y &&
      event.clientX &&
      event.clientY &&
      (Math.abs(event.clientX - x) > MoveBufferPx || Math.abs(event.clientY - y) > MoveBufferPx)
    ) {
      return;
    }
    if (this.props.selected) {
      this._deselectNode(event.metaKey, !event.metaKey);
    } else {
      this._selectNode();
    }
  };

  // noinspection JSUnusedGlobalSymbols
  handleClickOutside = event => {
    const { selected, infoShowing, onNodeDeselect, nis } = this.props;
    const ignore = !selected && !infoShowing;
    if (event.metaKey || event.shiftKey || ignore) {
      return;
    }
    onNodeDeselect && onNodeDeselect(nis, false);
  };

  _rename = () => this.setState({ renaming: true });
  _noRename = () => this.setState({ renaming: false });

  _setTitle = (s: string) => {
    this.props.nis.node.setTitle(s);
    this.forceUpdate();
  };

  render() {
    const { selected, infoShowing, visible, pos, scale, positionOffset, disabled } = this.props;
    const { node } = this.props.nis;
    const { loading, renaming } = this.state;
    const sel = infoShowing ? 'in-view' : selected ? 'selected' : '';
    let nodeClass = 'node' + (sel ? ` ${sel} ignore-react-onclickoutside` : '');
    if (!visible) {
      return <div />;
    }

    return (
      <Draggable
        disabled={disabled}
        position={pos}
        handle=".node"
        onStart={this.handleDragStart}
        onStop={this.handleDragStop}
        onDrag={this.handleDrag}
        scale={scale || 1}
        positionOffset={positionOffset}
      >
        <div
          className={nodeClass}
          onClick={this.handleClick}
          onDoubleClick={this._selectNodeWithResets}
          id={node.domId()}
        >
          <header
            className={`node-header${renaming ? ' node-header-edit' : ''}`}
            onDoubleClick={this._rename}
          >
            <EditInput
              editing={renaming}
              value={renaming ? node.title || '' : truncate(node.name(), 16)}
              onChange={this._setTitle}
              onFinish={this._noRename}
            />
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
              scale={scale || 1}
              positionOffset={positionOffset ? addVec(pos, positionOffset) : pos}
            />
          </div>
          {loading && <div className="spinner" />}
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
const getPos = (s, op) => s.graph.nodePos[op.nis.node.id] || op.nis.pos;

const makeSelectCreator = () =>
  createSelector(
    [getPos, getInfoShowing],
    (pos, infoShowing) => ({ pos, infoShowing })
  );

const makeSelect = () => {
  const selector = makeSelectCreator();
  return (s, op) => selector(s, op);
};

export default connect(makeSelect)(onClickOutside(HotkeysTarget(Node)));
