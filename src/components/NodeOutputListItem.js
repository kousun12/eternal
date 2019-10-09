// @flow
import React from 'react';
import type { DraggableData } from 'react-draggable';
import { DraggableCore } from 'react-draggable';
import type { Pos } from 'types';

type P = {
  index: number,
  onMouseDown: (number, MouseEvent, DraggableData) => void,
  item: string,
  filled: boolean,
  scale: number,
  positionOffset: Pos | typeof undefined,
};

export default class NodeOutputListItem extends React.Component<P> {
  onMouseDown = (e: MouseEvent, data: DraggableData) => {
    e.stopPropagation();
    e.preventDefault();
    this.props.onMouseDown(this.props.index, e, data);
  };

  noop = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  render() {
    const { filled, item, scale, positionOffset } = this.props;
    const modifier = filled ? '' : ' unconnected';
    return (
      <DraggableCore
        onStart={this.onMouseDown}
        offsetParent={document.getElementById('graph-scalable')}
      >
        <li>
          <span onClick={e => this.noop(e)}>
            {item} <i className={`fa fa-circle${modifier}`} />
          </span>
        </li>
      </DraggableCore>
    );
  }
}
