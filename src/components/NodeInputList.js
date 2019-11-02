// @flow

import React from 'react';

import NodeInputListItem from './NodeInputListItem';

// TODO: change this to type Item = {name: string, filled: boolean}
type P = {
  onCompleteConnector: number => void,
  items: string[],
  connected: string[],
  display: string[],
};

export default class NodeInputList extends  React.PureComponent<P> {
  onMouseUp = (i: number) => {
    this.props.onCompleteConnector(i);
  };

  render() {
    const { items, connected, display } = this.props;
    return (
      <div className="nodeInputWrapper">
        <ul className="nodeInputList">
          {items.map((item, i) => (
            <NodeInputListItem
              onMouseUp={this.onMouseUp}
              key={`item-${i}`}
              index={i}
              item={display[i]}
              filled={connected.includes(item)}
            />
          ))}
        </ul>
      </div>
    );
  }
}
