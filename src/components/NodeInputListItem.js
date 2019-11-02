// @flow

import React from 'react';

type P = { index: number, onMouseUp: number => void, item: string, filled: boolean };
type S = { hover: boolean };

export default class NodeInputListItem extends React.PureComponent<P, S> {
  state = { hover: false };

  onMouseUp = (e: MouseEvent) => {
    e.stopPropagation();
    this.props.onMouseUp(this.props.index);
  };
  onMouseOver = () => this.setState({ hover: true });
  onMouseOut = () => this.setState({ hover: false });

  render() {
    const { hover } = this.state;
    const { filled, item } = this.props;
    const icon = filled || hover ? 'fa-circle' : 'fa-circle';
    const modifier = hover ? ' hover' : filled ? ' connected-node' : '';
    return (
      <li onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut} onMouseUp={this.onMouseUp}>
        <span className={`input-text${modifier}`}>
          <i className={`fa ${icon}`} />
          {item}
        </span>
      </li>
    );
  }
}
