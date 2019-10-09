// @flow
import React from 'react';

import NodeOutputListItem from './NodeOutputListItem';
import type { Pos } from 'types';
import { DraggableData } from 'react-draggable';

type P = {
  onStartConnector: (number, MouseEvent, DraggableData) => void,
  items: string[],
  connected: string[],
  display: string[],
  scale: number,
  positionOffset: Pos | typeof undefined,
};

export default class NodeOutputList extends React.Component<P> {
  render() {
    const { items, connected, display, scale, positionOffset, onStartConnector } = this.props;
    return (
      <div className="nodeOutputWrapper">
        <ul className="nodeOutputList">
          {items.map((item, i) => {
            return (
              <NodeOutputListItem
                filled={connected.includes(item)}
                onMouseDown={onStartConnector}
                key={`item-${i}`}
                index={i}
                item={display[i]}
                scale={scale}
                positionOffset={positionOffset}
              />
            );
          })}
        </ul>
      </div>
    );
  }
}
