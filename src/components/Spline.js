// @flow
import React from 'react';
import { get } from 'lodash';
import onClickOutside from 'react-onclickoutside';
import type { Pos } from 'types';
import Edge from 'models/Edge';
import { Hotkey, Hotkeys, HotkeysTarget } from '@blueprintjs/core';

type P = { start: Pos, end: Pos, onRemove?: () => void, edge: ?Edge, highlighted?: boolean };
type S = { selected: boolean };

class Spline extends React.Component<P, S> {
  el: ?Element;
  state = { selected: false };
  listeningOnEdge: string;

  handleClick = () => this.setState({ selected: !this.state.selected });

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
    !this.state.selected &&
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
  handleClickOutside = event => {
    if (!this.state.selected || event.metaKey || event.shiftKey) {
      return;
    }
    this.setState({ selected: false });
  };

  handleRemove = () => {
    this.setState({ selected: false });
    this.props.onRemove && this.props.onRemove();
  };

  render() {
    let { selected } = this.state;
    let { start, end, highlighted, edge } = this.props;
    const dist = this.distance([start.x, start.y], [end.x, end.y]);
    const selfEdge = edge && get(edge, 'from.id') === get(edge, 'to.id');
    const pathString = this.bezierCurve(
      start.x, // start x
      start.y, // start y
      start.x + dist * (selfEdge ? 0.7 : 0.18), // cp1 x
      start.y - dist * (selfEdge ? 0.9 : 0), // cp1 y
      end.x - dist * (selfEdge ? 0.7 : 0.35), // cp2 x
      end.y - dist * (selfEdge ? 0.9 : 0), // cp2 y
      end.x, // end x
      end.y
    );

    const cls = 'connector' + (selected ? ' selected' : '') + (highlighted ? ' highlight' : '');
    return (
      <g>
        <path className="connector-click-area" d={pathString} onClick={this.handleClick} />
        <path className={cls} d={pathString} onClick={this.handleClick} ref={r => (this.el = r)} />
      </g>
    );
  }

  bezierCurve(a, b, cp1x, cp1y, cp2x, cp2y, x, y) {
    return `M${a},${b} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
  }

  distance(a, b) {
    return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
  }

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    let { selected } = this.state;
    if (!selected) {
      return <Hotkeys />;
    }
    return (
      <Hotkeys>
        <Hotkey
          group="Edge Actions"
          combo="backspace"
          label="Delete edge"
          global={true}
          onKeyDown={this.handleRemove}
        />
      </Hotkeys>
    );
  }
}

export default onClickOutside(HotkeysTarget(Spline));
