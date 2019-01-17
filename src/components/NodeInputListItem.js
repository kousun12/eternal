// @flow

import React, { Component } from 'react';

type P = {
  index: number,
  onMouseUp: number => void,
  item: string,
  filled: boolean,
};

type S = { hover: boolean };
export default class NodeInputListItem extends Component<P, S> {
  constructor(props: P) {
    super(props);
    this.state = { hover: false };
  }

  onMouseUp = (e: SyntheticEvent<*>) => {
    e.stopPropagation();
    e.preventDefault();
    this.props.onMouseUp(this.props.index);
  };

  onMouseOver = () => {
    this.setState({ hover: true });
  };

  onMouseOut = () => {
    this.setState({ hover: false });
  };

  noop(e: SyntheticEvent<*>) {
    e.stopPropagation();
    e.preventDefault();
  }

  render() {
    const { hover } = this.state;
    const { filled, item } = this.props;
    const icon = filled || hover ? 'fa-circle' : 'fa-circle-o';
    const modifier = hover ? ' hover' : filled ? ' connected-node' : '';

    return (
      <li>
        <span onClick={e => this.noop(e)} onMouseUp={e => this.onMouseUp(e)} className="input-text">
          <i
            className={`fa ${icon}${modifier}`}
            onMouseOver={this.onMouseOver}
            onMouseOut={this.onMouseOut}
          />
          {item}
        </span>
      </li>
    );
  }
}
