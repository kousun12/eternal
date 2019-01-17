// @flow
import React from 'react';

type P = {
  index: number,
  onMouseDown: number => void,
  item: string,
  filled: boolean,
};

export default class NodeOutputListItem extends React.Component<P> {
  onMouseDown(e: SyntheticEvent<*>) {
    e.stopPropagation();
    e.preventDefault();
    this.props.onMouseDown(this.props.index);
  }

  noop(e: SyntheticEvent<*>) {
    e.stopPropagation();
    e.preventDefault();
  }

  render() {
    const { filled, item } = this.props;
    const modifier = filled ? '' : ' unconnected';
    return (
      <li onMouseDown={e => this.onMouseDown(e)}>
        <span onClick={e => this.noop(e)}>
          {item} <i className={`fa fa-circle${modifier}`} />
        </span>
      </li>
    );
  }
}
