/* eslint-disable */
import React from 'react';
import AutosizeTextarea from 'react-textarea-autosize';

import dispatcher from './../helpers/dispatcher';
import parseInput from './../helpers/parseInput';
import stringifyVariable from './../helpers/stringifyVariable';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import glsl from 'react-syntax-highlighter/dist/esm/languages/hljs/glsl';
import syntaxTheme from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('glsl', glsl);

//data type components
import {
  JsonBoolean,
  JsonDate,
  JsonFloat,
  JsonFunction,
  JsonInteger,
  JsonNan,
  JsonNull,
  JsonRegexp,
  JsonString,
  JsonUndefined,
} from './DataTypes/DataTypes';

import { Edit, CheckCircle, RemoveCircle as Remove } from './icons';

//theme
import Theme from './../themes/getStyle';
import { Hotkey, Hotkeys, HotkeysTarget } from '@blueprintjs/core';

class VariableEditor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      editMode: false,
      editValue: '',
      renameKey: false,
      parsedInput: { type: false, value: null },
    };
  }

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    if (!this.props.editOnHotkey) {
      return <Hotkeys />;
    }
    return (
      <Hotkeys>
        <Hotkey
          group="Detail Pane"
          global={Boolean(this.props.variable)}
          combo="meta + i"
          label="Edit First Value"
          onKeyDown={() => this.prepopInput(this.props.variable)}
        />
      </Hotkeys>
    );
  }

  renderKey = () => {
    const { type, isPrimitive, variable, theme, namespace } = this.props;
    if (isPrimitive) return null;
    return type === 'array' ? (
      <span {...Theme(theme, 'array-key')} key={variable.name + '_' + namespace}>
        {variable.name}
        <div {...Theme(theme, 'colon')}>:</div>
      </span>
    ) : (
      <span>
        <span
          {...Theme(theme, 'object-name')}
          className="object-key"
          key={variable.name + '_' + namespace}
        >
          <span style={{ display: 'inline-block' }}>{variable.name}</span>
        </span>
        <span {...Theme(theme, 'colon')}>:</span>
      </span>
    );
  };

  render() {
    const {
      variable,
      singleIndent,
      theme,
      namespace,
      indentWidth,
      onEdit,
      onDelete,
      onSelect,
      isPrimitive,
    } = this.props;
    const { editMode } = this.state;

    const overrideStyle = isPrimitive
      ? { paddingLeft: 0, borderLeft: 'none' }
      : { paddingLeft: indentWidth * singleIndent };
    return (
      <div
        {...Theme(theme, 'objectKeyVal', overrideStyle)}
        className="variable-row"
        key={variable.name}
      >
        {this.renderKey()}
        <div
          className="variable-value"
          onClick={
            onSelect === false && onEdit === false
              ? null
              : e => {
                  let location = [...namespace];
                  if ((e.ctrlKey || e.metaKey) && onEdit !== false) {
                    this.prepopInput(variable);
                  } else if (onSelect !== false) {
                    location.shift();
                    onSelect({
                      ...variable,
                      namespace: location,
                    });
                  }
                }
          }
          {...Theme(theme, 'variableValue', {
            cursor: onSelect === false ? 'default' : 'pointer',
          })}
        >
          {this.getValue(variable, editMode)}
        </div>
        {onEdit !== false && editMode === false ? this.getEditIcon() : null}
        {onDelete !== false && editMode === false ? this.getRemoveIcon() : null}
      </div>
    );
  }

  getEditIcon = () => {
    const { variable, theme } = this.props;

    return (
      <span className="click-to-edit" style={{ verticalAlign: 'middle' }}>
        <Edit
          className="click-to-edit-icon"
          {...Theme(theme, 'editVarIcon')}
          onClick={() => this.prepopInput(variable)}
        />
      </span>
    );
  };

  prepopInput = variable => {
    if (this.props.onEdit !== false) {
      const stringifiedValue = stringifyVariable(variable.value);
      const detected = parseInput(stringifiedValue);
      this.setState({
        editMode: true,
        editValue: stringifiedValue,
        parsedInput: {
          type: detected.type,
          value: detected.value,
        },
      });
    }
  };

  getRemoveIcon = () => {
    const { variable, namespace, theme, rjvId } = this.props;

    return (
      <div className="click-to-remove" style={{ verticalAlign: 'top' }}>
        <Remove
          className="click-to-remove-icon"
          {...Theme(theme, 'removeVarIcon')}
          onClick={() => {
            dispatcher.dispatch({
              name: 'VARIABLE_REMOVED',
              rjvId: rjvId,
              data: {
                name: variable.name,
                namespace: namespace,
                existing_value: variable.value,
                variable_removed: true,
              },
            });
          }}
        />
      </div>
    );
  };

  getValue = (variable, editMode) => {
    if (editMode) {
      return this.getEditInput();
    }
    const { attrType } = this.props;
    if (attrType.name === 'JSFunction') {
      return (
        <SyntaxHighlighter
          language="javascript"
          style={syntaxTheme}
          codeTagProps={{ className: 'syntax-highlighter' }}
        >
          {variable.value}
        </SyntaxHighlighter>
      );
    } else if (['GPGPUKernel', 'ShaderProgram'].includes(attrType.name)) {
      return (
        <SyntaxHighlighter
          language="glsl"
          style={syntaxTheme}
          codeTagProps={{ className: 'syntax-highlighter' }}
        >
          {variable.value}
        </SyntaxHighlighter>
      );
    }
    const type = variable.type;
    const { props } = this;
    switch (type) {
      case 'string':
        return <JsonString value={variable.value} {...props} />;
      case 'integer':
        return <JsonInteger value={variable.value} {...props} />;
      case 'float':
        return <JsonFloat value={variable.value} {...props} />;
      case 'boolean':
        return <JsonBoolean value={variable.value} {...props} />;
      case 'function':
        return <JsonFunction value={variable.value} {...props} />;
      case 'null':
        return <JsonNull {...props} />;
      case 'nan':
        return <JsonNan {...props} />;
      case 'undefined':
        return <JsonUndefined {...props} />;
      case 'date':
        return <JsonDate value={variable.value} {...props} />;
      case 'regexp':
        return <JsonRegexp value={variable.value} {...props} />;
      default:
        // catch-all for types that weren't anticipated
        return <div className="object-value">{JSON.stringify(variable.value)}</div>;
    }
  };

  getEditInput = () => {
    const { theme } = this.props;
    const { editValue } = this.state;
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', width: '100%', flexDirection: 'column' }}
      >
        <AutosizeTextarea
          type="text"
          inputRef={input => input && input.focus()}
          value={editValue}
          className="variable-editor"
          onChange={event => {
            const value = event.target.value;
            const detected = parseInput(value);
            this.setState({
              editValue: value,
              parsedInput: {
                type: detected.type,
                value: detected.value,
              },
            });
          }}
          onKeyDown={e => {
            switch (e.key) {
              case 'Escape': {
                this.setState({
                  editMode: false,
                  editValue: '',
                });
                break;
              }
              case 'Enter': {
                if (e.ctrlKey || e.metaKey) {
                  this.submitEdit(true);
                }
                break;
              }
            }
            e.stopPropagation();
          }}
          placeholder="edit..."
          {...Theme(theme, 'edit-input')}
        />
        <div {...Theme(theme, 'edit-icon-container')}>
          <div {...Theme(theme, 'cancel-icon')}>
            <Remove
              className="edit-cancel"
              onClick={() => {
                this.setState({ editMode: false, editValue: '' });
              }}
            />
          </div>
          <div {...Theme(theme, 'check-icon')}>
            <CheckCircle
              className="edit-check string-value"
              onClick={() => this.submitEdit(true)}
            />
          </div>
        </div>
      </div>
    );
  };

  submitEdit = submit_detected => {
    const { variable, namespace, rjvId } = this.props;
    const { editValue, parsedInput } = this.state;
    let new_value = editValue;
    if (submit_detected && parsedInput.type) {
      new_value = parsedInput.value;
    }
    this.setState({
      editMode: false,
    });
    dispatcher.dispatch({
      name: 'VARIABLE_UPDATED',
      rjvId: rjvId,
      data: {
        name: variable.name,
        namespace: namespace,
        existing_value: variable.value,
        new_value: new_value,
        variable_removed: false,
      },
    });
  };

  getDetectedInput = () => {
    const { parsedInput } = this.state;
    const { type, value } = parsedInput;
    const { props } = this;
    const { theme } = props;

    if (type !== false) {
      switch (type.toLowerCase()) {
        case 'object':
          return (
            <span>
              <span
                style={{
                  ...Theme(theme, 'brace').style,
                  cursor: 'default',
                }}
              >
                {'{'}
              </span>
              <span
                style={{
                  ...Theme(theme, 'ellipsis').style,
                  cursor: 'default',
                }}
              >
                ...
              </span>
              <span
                style={{
                  ...Theme(theme, 'brace').style,
                  cursor: 'default',
                }}
              >
                {'}'}
              </span>
            </span>
          );
        case 'array':
          return (
            <span>
              <span
                style={{
                  ...Theme(theme, 'brace').style,
                  cursor: 'default',
                }}
              >
                {'['}
              </span>
              <span
                style={{
                  ...Theme(theme, 'ellipsis').style,
                  cursor: 'default',
                }}
              >
                ...
              </span>
              <span
                style={{
                  ...Theme(theme, 'brace').style,
                  cursor: 'default',
                }}
              >
                {']'}
              </span>
            </span>
          );
        case 'string':
          return <JsonString value={value} {...props} />;
        case 'integer':
          return <JsonInteger value={value} {...props} />;
        case 'float':
          return <JsonFloat value={value} {...props} />;
        case 'boolean':
          return <JsonBoolean value={value} {...props} />;
        case 'function':
          return <JsonFunction value={value} {...props} />;
        case 'null':
          return <JsonNull {...props} />;
        case 'nan':
          return <JsonNan {...props} />;
        case 'undefined':
          return <JsonUndefined {...props} />;
        case 'date':
          return <JsonDate value={new Date(value)} {...props} />;
      }
    }
  };
}

export default HotkeysTarget(VariableEditor);
