// @flow
import React from 'react';
import onClickOutside from 'react-onclickoutside';

import TrashIcon from './TrashIcon';
import type { Pos } from 'types';
import Edge from 'models/Edge';

type P = {
  start: Pos,
  end: Pos,
  onClick?: (SyntheticMouseEvent<>) => void,
  onClickOutside?: (SyntheticMouseEvent<>) => void,
  onRemove?: (SyntheticMouseEvent<>) => void,
  edge: ?Edge,
  highlighted?: boolean,
};

type S = { selected: boolean, position: Pos };

class Spline extends React.Component<P, S> {
  el: ?Element;
  state = {
    selected: false,
    position: { x: 0, y: 0 },
  };
  listeningOnEdge: string;

  handleClick = e => {
    this.setState({
      selected: !this.state.selected,
      position: { x: e.clientX, y: e.clientY },
    });

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  };

  componentDidMount() {
    this._setListener();
  }

  componentDidUpdate() {
    this._setListener();
  }

  _setListener = () => {
    if (this.props.edge && this.listeningOnEdge !== this.props.edge.id) {
      this.props.edge.notifyListener = this._onNotify;
      this.listeningOnEdge = this.props.edge.id;
    }
  };

  _onNotify = () => {
    this.el &&
      // $FlowIssue
      this.el.animate(
        [
          { stroke: '#999999', strokeWidth: 4, filter: 'blur(0)' },
          { stroke: '#4caa4d', strokeWidth: 6, filter: 'blur(20px)' },
          { stroke: '#999999', strokeWidth: 4, filter: 'blur(0)' },
        ],
        { duration: 500, iterations: 1 }
      );
  };

  // noinspection JSUnusedGlobalSymbols
  handleClickOutside = e => {
    this.setState({ selected: false });
    if (this.props.onClickOutside) {
      this.props.onClickOutside(e);
    }
  };

  handleRemove = e => {
    this.setState({ selected: false });
    if (this.props.onRemove) {
      this.props.onRemove(e);
    }
  };

  render() {
    let { selected, position } = this.state;
    let { start, end, highlighted } = this.props;
    let dist = this.distance([start.x, start.y], [end.x, end.y]);
    let pathString = this.bezierCurve(
      start.x, // start x
      start.y, // start y
      start.x + dist * 0.18, // cp1 x
      start.y, // cp1 y
      end.x - dist * 0.35, // cp2 x
      end.y, // cp2 y
      end.x, // end x
      end.y
    );

    const cls = 'connector' + (selected ? ' selected' : '') + (highlighted ? ' highlight' : '');
    return (
      <g>
        <path className="connector-click-area" d={pathString} onClick={this.handleClick} />
        <path className={cls} d={pathString} onClick={this.handleClick} ref={r => (this.el = r)} />
        {selected ? <TrashIcon position={position} onClick={this.handleRemove} /> : null}
      </g>
    );
  }

  bezierCurve(a, b, cp1x, cp1y, cp2x, cp2y, x, y) {
    return `M${a},${b} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
  }

  distance(a, b) {
    return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
  }
}

export default onClickOutside(Spline);
