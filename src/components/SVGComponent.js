import React from 'react';

export default class SVGComponent extends React.PureComponent {
  render() {
    const { children, ...rest } = this.props;
    return <svg {...rest}>{children}</svg>;
  }
}
