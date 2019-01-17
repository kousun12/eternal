// @flow
import React from 'react';

import NodeOutputListItem from './NodeOutputListItem';

type P = {
  onStartConnector: number => void,
  items: string[],
  connected: string[],
};
export default class NodeOutputList extends React.Component<P> {
  onMouseDown = (i: number) => {
    this.props.onStartConnector(i);
  };

  render() {
    const { items, connected } = this.props;
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
                item={item}
              />
            );
          })}
        </ul>
      </div>
    );
  }
}
