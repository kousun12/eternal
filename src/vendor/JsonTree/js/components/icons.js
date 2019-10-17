import React from 'react';

const DEFAULT_COLOR = '#000000';

export class CircleMinus extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <svg
          {...getIconStyle(style)}
          viewBox="0 0 24 24"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7,13H17V11H7" />
        </svg>
      </span>
    );
  }
}

export class CirclePlus extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <svg
          {...getIconStyle(style)}
          viewBox="0 0 24 24"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z" />
        </svg>
      </span>
    );
  }
}

export class SquareMinus extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;
    const svgStyle = getIconStyle(style).style;

    return (
      <span {...rest}>
        <svg
          fill={svgStyle.color}
          width={svgStyle.height}
          height={svgStyle.width}
          style={svgStyle}
          viewBox="0 0 1792 1792"
        >
          <path d="M1344 800v64q0 14-9 23t-23 9h-832q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h832q14 0 23 9t9 23zm128 448v-832q0-66-47-113t-113-47h-832q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113zm128-832v832q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h832q119 0 203.5 84.5t84.5 203.5z" />
        </svg>
      </span>
    );
  }
}

export class SquarePlus extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;
    const svgStyle = getIconStyle(style).style;

    return (
      <span {...rest}>
        <svg
          fill={svgStyle.color}
          width={svgStyle.height}
          height={svgStyle.width}
          style={svgStyle}
          viewBox="0 0 1792 1792"
        >
          <path d="M1344 800v64q0 14-9 23t-23 9h-352v352q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-352h-352q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h352v-352q0-14 9-23t23-9h64q14 0 23 9t9 23v352h352q14 0 23 9t9 23zm128 448v-832q0-66-47-113t-113-47h-832q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113zm128-832v832q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h832q119 0 203.5 84.5t84.5 203.5z" />
        </svg>
      </span>
    );
  }
}

export class ArrowRight extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <svg
          style={{ ...getIconStyle(style).style, paddingLeft: '2px', verticalAlign: 'top' }}
          viewBox="0 0 15 15"
          fill="currentColor"
        >
          <path d="M0 14l6-6-6-6z" />
        </svg>
      </span>
    );
  }
}

export class ArrowDown extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <svg
          style={{ ...getIconStyle(style).style, paddingLeft: '2px', verticalAlign: 'top' }}
          viewBox="0 0 15 15"
          fill="currentColor"
        >
          <path d="M0 5l6 6 6-6z" />
        </svg>
      </span>
    );
  }
}

export class Clippy extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <svg
          {...getIconStyle(style)}
          viewBox="0 0 40 40"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
        >
          <g>
            <path d="m30 35h-25v-22.5h25v7.5h2.5v-12.5c0-1.4-1.1-2.5-2.5-2.5h-7.5c0-2.8-2.2-5-5-5s-5 2.2-5 5h-7.5c-1.4 0-2.5 1.1-2.5 2.5v27.5c0 1.4 1.1 2.5 2.5 2.5h25c1.4 0 2.5-1.1 2.5-2.5v-5h-2.5v5z m-20-27.5h2.5s2.5-1.1 2.5-2.5 1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5 1.3 2.5 2.5 2.5h2.5s2.5 1.1 2.5 2.5h-20c0-1.5 1.1-2.5 2.5-2.5z m-2.5 20h5v-2.5h-5v2.5z m17.5-5v-5l-10 7.5 10 7.5v-5h12.5v-5h-12.5z m-17.5 10h7.5v-2.5h-7.5v2.5z m12.5-17.5h-12.5v2.5h12.5v-2.5z m-7.5 5h-5v2.5h5v-2.5z" />
          </g>
        </svg>
      </span>
    );
  }
}

export class RemoveCircle extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <i className="fa fa-remove attr-indicator" />
      </span>
    );
  }
}

export class AddCircle extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <svg
          {...getIconStyle(style)}
          viewBox="0 0 40 40"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
        >
          <g>
            <path d="m30.1 21.4v-2.8q0-0.6-0.4-1t-1-0.5h-5.7v-5.7q0-0.6-0.4-1t-1-0.4h-2.9q-0.6 0-1 0.4t-0.4 1v5.7h-5.7q-0.6 0-1 0.5t-0.5 1v2.8q0 0.6 0.5 1t1 0.5h5.7v5.7q0 0.5 0.4 1t1 0.4h2.9q0.6 0 1-0.4t0.4-1v-5.7h5.7q0.6 0 1-0.5t0.4-1z m7.2-1.4q0 4.7-2.3 8.6t-6.3 6.2-8.6 2.3-8.6-2.3-6.2-6.2-2.3-8.6 2.3-8.6 6.2-6.2 8.6-2.3 8.6 2.3 6.3 6.2 2.3 8.6z" />
          </g>
        </svg>
      </span>
    );
  }
}

export class Add extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <svg
          {...getIconStyle(style)}
          viewBox="0 0 40 40"
          fill="currentColor"
          preserveAspectRatio="xMidYMid meet"
        >
          <g>
            <path d="m31.6 21.6h-10v10h-3.2v-10h-10v-3.2h10v-10h3.2v10h10v3.2z" />
          </g>
        </svg>
      </span>
    );
  }
}

export class Edit extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;
    return <span {...rest}>edit</span>;
  }
}

export class CheckCircle extends React.PureComponent {
  render() {
    const { props } = this;
    const { style, ...rest } = props;

    return (
      <span {...rest}>
        <i className="fa fa-check attr-indicator" />
      </span>
    );
  }
}

function getIconStyle(style) {
  if (!style) {
    style = {};
  }
  return {
    style: {
      verticalAlign: 'middle',
      ...style,
      color: style.color ? style.color : DEFAULT_COLOR,
      height: '1em',
      width: '1em',
    },
  };
}
