import React, { Component } from 'react';

export default class SVGComponent extends Component {
  render() {
    return (
      <svg {...this.props}>
        {this.props.children}
      </svg>
    );
  }
}
