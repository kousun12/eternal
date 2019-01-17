// @flow
import React from 'react';
import { get } from 'lodash';
import NodeBase from 'models/NodeBase';
const Types = window.Types

export class DomNode extends NodeBase<{}, { html: string }, null> {
  static +displayName = 'HTML Element';
  static +registryName = 'DomNode';
  static description = <span>A node that renders HTML to the screen</span>;
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
  domNode: HTMLElement;

  onAddToGraph = () => {
    this.domNode = document.createElement('div');
    document.getElementsByTagName('body')[0].appendChild(this.domNode);
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (!prevProps || newProps.text !== prevProps.text) {
      this.domNode.innerText = newProps.text;
    }
    if (!prevProps || newProps.html !== prevProps.html) {
      this.domNode.innerHTML = newProps.html;
    }
    if (!prevProps || newProps.style !== prevProps.style) {
      this.domNode.setAttribute('style', newProps.style);
    }
  };

  process = () => null;
}
