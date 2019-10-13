// @flow
import React, { Component } from 'react';
import { get, throttle } from 'lodash';
import { DraggableCore } from 'react-draggable';
import type { AnyNode, Changeable, Displayable } from 'models/NodeBase';
import JsonTree from 'vendor/JsonTree/js';
import InfoPopup from 'components/AttributePane/InfoPopup';
import { Hotkey, Hotkeys, HotkeysTarget, PopoverInteractionKind } from '@blueprintjs/core';
import NodeBase from 'models/NodeBase';

const Types = window.Types;

type P = { node: AnyNode };
type S = { fullDocs: boolean, width: number };

class AttributePane extends Component<P, S> {
  state = { fullDocs: true, width: 380 };
  listener: ?string;

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    return (
      <Hotkeys>
        <Hotkey
          global={Boolean(this.props.node)}
          group="Detail Pane"
          combo="meta + j"
          label="Toggle Docs"
          onKeyDown={this._toggleDocs}
        />
      </Hotkeys>
    );
  }

  componentDidMount() {
    this.props.node && this._setListener(this.props.node);
  }

  componentDidUpdate(oldProps: P) {
    if (get(this, 'props.node.id') !== get(oldProps, 'node.id')) {
      if (oldProps && oldProps.node) {
        const listener = this.listener;
        listener && oldProps.node.removeListener(listener);
        this.listener = null;
      }
      this.props.node && this._setListener(this.props.node);
    }
  }

  _setListener = (node: AnyNode) => {
    this.listener = node.registerListener(this._updateListener);
  };

  // No one needs to see that many updates
  _updateListener = throttle(() => this.forceUpdate(), 60);

  componentWillUnmount() {
    const {
      props: { node },
      listener,
    } = this;
    listener && node.removeListener(listener);
  }

  _helpInfo = (c: Changeable) => {
    if (!c.type.hasHelpInfo() || this.state.fullDocs) {
      return null;
    }
    return (
      <InfoPopup
        anchor={<i className="fa fa-eye attr-indicator attr-help" />}
        content={c.type.description}
        contentDesc="DESCRIPTION"
        interactionKind={PopoverInteractionKind.CLICK}
      />
    );
  };

  _docInfo = (c: Changeable) => {
    if (!this.state.fullDocs) {
      return null;
    }
    return <div className="attr-doc">{c.type.description}</div>;
  };

  _changeables = () => {
    const changeables = this.props.node.changeables();
    // $FlowIssue
    return Object.keys(changeables).map((k, j: number) => {
      const list = (changeables[k]: Changeable[]).map((c: Changeable, i) => (
        <div key={`changeable-${i}-${k}`}>
          <div className="attr-title">
            {c.title}
            {this._helpInfo(c)}
            <span style={styles.spacer} />
            <InfoPopup
              anchor={<span className="attr-type-indicator attr-help">{c.type.name}</span>}
              content={c.type.typeDescription}
              contentDesc="TYPE"
            />
          </div>
          {this._docInfo(c)}
          <div className={`attr-value-row${i === changeables[k].length - 1 ? ' attr-last' : ''}`}>
            <MultiTypeEditor item={c} editOnHotkey={i === 0 && j === 0} />
          </div>
        </div>
      ));
      return (
        <div key={k}>
          <div className="changeable-section-title">{k}:</div>
          <div>{list}</div>
        </div>
      );
    });
  };

  truncate = (string: string, len: number = 100) => {
    if (string.length > len) return string.substring(0, len) + '...';
    else return string;
  };

  _description = () => {
    const { node } = this.props;
    const { fullDocs } = this.state;
    if (!node.constructor.description) {
      return null;
    }
    const desc = node.constructor.description;
    // $FlowIssue
    const t = fullDocs ? desc : this.truncate(desc);
    return <div className={`node-description`}>{t}</div>;
  };

  _signature = () => {
    return this.props.node.signature(0, {
      fontSize: 10,
      padding: '0 16px 12px',
      color: 'rgba(250, 250, 250, 0.8)',
    });
  };

  _toggleDocs = () => this.setState({ fullDocs: !this.state.fullDocs });

  _onResize = (e: MouseEvent) => this.setState({ width: window.innerWidth - e.clientX });

  render() {
    if (!this.props.node) {
      return <div />;
    }
    const { fullDocs, width } = this.state;
    return (
      <div className="attribute-pane ignore-react-onclickoutside" style={{ width }}>
        <h3 className="pane-header">
          {this.props.node.title || NodeBase.nameFrom(this.props.node.constructor)}
        </h3>
        {this._signature()}
        {this._description()}
        <div className="attr-doc-toggle" onClick={this._toggleDocs}>
          {fullDocs ? 'Collapse' : 'Expand'} Docs
        </div>
        <hr />
        <div className="attr-list">{this._changeables()}</div>
        <DraggableCore onDrag={this._onResize}>
          <div id="attr-pane-resizer" />
        </DraggableCore>
      </div>
    );
  }
}

type MP = {
  item: Displayable,
  disabled?: boolean,
  editOnHotkey?: boolean,
};

class MultiTypeEditor extends Component<MP> {
  static defaultProps = { disabled: false, editOnHotkey: false };

  _isComplex = (): boolean => {
    if (this.props.item.type.isA(Types.any)) {
      // Best guess when we can't know
      return typeof this.props.item.value === 'object';
    }
    return this.props.item.type.isComplex();
  };

  _onEdit = (e: { updated_src: Object }) => {
    const onChange = get(this.props, 'item.onChange');
    if (onChange) {
      onChange(this._isComplex() ? e.updated_src : e.updated_src.value);
    }
  };

  _getEdit = () => {
    if (get(this.props, 'item.onChange')) {
      return this._onEdit;
    }
    return undefined;
  };

  render() {
    const { value, type } = this.props.item;
    const complex = this._isComplex();
    const val = complex ? value : { value };
    return (
      <JsonTree
        src={val}
        attrType={type}
        isPrimitive={!complex}
        name={null}
        indentWidth={2}
        collapsed={1}
        onEdit={this._getEdit()}
        enableClipboard={false}
        displayObjectSize={false}
        collapseStringsAfterLength={20}
        displayDataTypes={false}
        rejectMatching={/^_/}
        editOnHotkey={this.props.editOnHotkey}
      />
    );
  }
}

const styles = { spacer: { flex: 1 } };

export default HotkeysTarget(AttributePane);
