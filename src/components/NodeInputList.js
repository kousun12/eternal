// @flow

import React from 'react';

import NodeInputListItem from './NodeInputListItem';

// TODO: change this to type Item = {name: string, filled: boolean}
type P = {
  onCompleteConnector: number => void,
  items: string[],
  connected: string[],
};

export default class NodeInputList extends React.Component<P> {
  onMouseUp = (i: number) => {
    this.props.onCompleteConnector(i);
  };

  render() {
    const { items, connected } = this.props;
    return (
      <div className="nodeInputWrapper">
        <ul className="nodeInputList">
          {items.map((item, i) => (
            <NodeInputListItem
              onMouseUp={this.onMouseUp}
              key={`item-${i}`}
              index={i}
              item={item}
              filled={connected.includes(item)}
            />
          ))}
        </ul>
      </div>
    );
  }
}
