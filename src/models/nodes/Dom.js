// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';

const Types = window.Types;

export class DomNode extends NodeBase<{}, { html: string, style: string, text: ?string }, null> {
  static +displayName = 'HTML Element';
  static +registryName = 'DomNode';
  static description = (<span>A node that renders HTML to the screen</span>);
  static defaultProps = { html: '' };
  static schema = {
    input: {
      html: Types.string.desc('The html for this element'),
      text: Types.string.desc('The inner text of this element'),
      style: Types.string.desc('The style attribute for this node'),
    },
    output: {},
    state: {},
  };
  insertedNode: HTMLElement;
  inserted: boolean = false;

  _ensureExist = () => {
    if (this.inserted) {
      return;
    }
    this.insertedNode = document.createElement('div');
    this.props.style && this.insertedNode.setAttribute('style', this.props.style);
    setTimeout(() => this._tryInsert(), 20);
  };

  _tryInsert = () => {
    if (this.inserted) {
      return;
    }
    const root = document.getElementById('graph-root');
    const scalable = document.getElementById('graph-scalable');
    if (root && scalable) {
      this.inserted = Boolean(root.insertBefore(this.insertedNode, scalable));
    }
    if (!this.inserted) {
      setTimeout(() => this._tryInsert(), 20);
    }
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    this._ensureExist();
    if (!prevProps || newProps.text !== prevProps.text) {
      this.insertedNode.innerText = newProps.text;
    }
    if (!prevProps || newProps.html !== prevProps.html) {
      this.insertedNode.innerHTML = newProps.html;
    }
    if (!prevProps || newProps.style !== prevProps.style) {
      this.insertedNode.setAttribute('style', newProps.style);
    }
  };

  process = () => null;
}
