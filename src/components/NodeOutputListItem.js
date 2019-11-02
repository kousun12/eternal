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

export default class NodeOutputListItem extends  React.PureComponent<P> {
  onMouseDown = (e: MouseEvent, data: DraggableData) => {
    e.stopPropagation();
    e.preventDefault();
    this.props.onMouseDown(this.props.index, e, data);
  };

  onClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const { onMouseDown, index } = this.props;
    onMouseDown(index, e);
  };

  render() {
    const { filled, item } = this.props;
    const modifier = filled ? '' : ' unconnected';
    return (
      <DraggableCore onStart={this.onMouseDown}>
        <li onClick={this.onClick}>
          <span>
            {item}
            <i className={`fa fa-circle${modifier}`} />
          </span>
        </li>
      </DraggableCore>
    );
  }
}
