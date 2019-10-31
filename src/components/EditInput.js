// @flow
import React from 'react';
import { Classes } from '@blueprintjs/core';
import { get } from 'lodash';

type P = {
  onChange: string => void,
  onFinish?: string => void,
  editing?: boolean | typeof undefined,
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

  _toEdit = (e: MouseEvent) => {
    if (this._isControlled()) {
      return;
    }
    e.stopPropagation();
    this.setState({ editing: true }, this._focusInput);
  };

  _onBlur = (e: SyntheticInputEvent<*>) => {
    const { onFinish } = this.props;
    onFinish && onFinish(e.target.value);
    if (!this._isControlled()) {
      this.setState({ editing: false });
    }
  };

  _focusInput = () => this.input && this.input.focus();

  _isControlled = (): boolean => this.props.editing !== undefined;

  componentDidUpdate(prevProps: P) {
    if (prevProps.editing === false && this.props.editing) {
      this._focusInput();
    }
  }

  render() {
    const { style, value, onChange } = this.props;
    const editing = this.props.editing === undefined ? this.state.editing : this.props.editing;
    return editing ? (
      <div className="bp3-dark">
        <input
          ref={input => (this.input = input)}
          style={{ ...styles.input, ...style }}
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

const styles = {
  input: { textAlign: 'inherit' },
};
