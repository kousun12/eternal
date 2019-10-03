// @flow
import React from 'react';

import NodeOutputListItem from './NodeOutputListItem';

type P = {
  onStartConnector: number => void,
  items: string[],
  connected: string[],
  display: string[],
};
export default class NodeOutputList extends React.Component<P> {
  onMouseDown = (i: number) => {
    this.props.onStartConnector(i);
  };

  render() {
    const { items, connected, display } = this.props;
    return (
      <div className="nodeOutputWrapper">
        <ul className="nodeOutputList">
          {items.map((item, i) => {
            return (
              <NodeOutputListItem
                filled={connected.includes(item)}
                onMouseDown={this.onMouseDown}
                key={`item-${i}`}
                index={i}
                item={display[i]}
              />
            );
          })}
        </ul>
      </div>
    );
  }
}
