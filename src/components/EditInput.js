// @flow
import React from 'react';
import { Classes } from '@blueprintjs/core';
import { get } from 'lodash';

type P = {
  onChange: string => void,
  onFinish?: string => void,
  style?: Object,
  value: string,
};
type S = { editing: boolean };

export default class EditInput extends React.Component<P, S> {
  input: ?HTMLInputElement;
  state = { editing: false };

  _onInputKeyUp = (e: SyntheticInputEvent<*>) => {
    const { onFinish } = this.props;
    if (get(e, 'key') === 'Enter') {
      onFinish && onFinish(e.target.value);
      this.input && this.input.blur();
    }
  };

  _toEdit = () => this.setState({ editing: true }, () => this.input && this.input.focus());
  _onBlur = (e: SyntheticInputEvent<*>) => {
    const { onFinish } = this.props;
    onFinish && onFinish(e.target.value);
    this.setState({ editing: false });
  };

  render() {
    const { editing } = this.state;
    const { style, value, onChange } = this.props;
    return editing || true ? (
      <div className="bp3-dark">
        <input
          ref={input => (this.input = input)}
          style={style}
          onKeyUp={this._onInputKeyUp}
          className={Classes.INPUT}
          type="text"
          placeholder="untitled"
          dir="auto"
          onChange={e => onChange(e.target.value)}
          onBlur={this._onBlur}
          value={value}
        />
      </div>
    ) : (
      <span style={style} onClick={this._toEdit}>
        {value}
      </span>
    );
  }
}
