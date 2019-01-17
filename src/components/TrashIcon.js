import React from 'react';

export default class TrashIcon extends React.Component {
  constructor(props) {
    super(props);
  }

  handleClick = e => {
    if (this.props.onClick) {
      this.props.onClick(e);
    }
  };

  render() {
    let { position } = this.props;
    return (
      <g
        className="trash-icon"
        fill="none"
        stroke="none"
        strokeWidth="1"
        transform={`translate(${position.x - 6},${position.y + 15})`}
        onClick={this.handleClick}>
        <circle className="trash-icon-bg" cx={7} cy={7} r="14" />
        <g
          className="trash-icon-trashcan"
          fill="#FFFFFF"
          transform="translate(-336.000000, -192.000000)">
          <path
            d="M347.999959,195 L350,195 L350,196 L349,196 L349,207.001498 C349,207.552511 348.554265,208 348.004423,208 L338.995577,208 C338.444837,208 338,207.552955 338,207.001498 L338,196 L337,196 L337,195 L338.995577,195 L339.000042,195 L339,194.990631 L339,193.009369 C339,192.443353 339.446616,192 339.997545,192 L347.002455,192 C347.553689,192 348,192.45191 348,193.009369 L348,194.990631 Z M340,194 L340,195 L347,195 L347,194 C347,193.447715 346.552285,193 346,193 L341,193 C340.447715,193 340,193.447715 340,194 Z M339,196 L339,207 L348,207 L348,196 Z M341,197 L342,197 L342,206 L341,206 Z M343,197 L344,197 L344,206 L343,206 Z M345,197 L345,206 L346,206 L346,197 L345,197 Z M345,197"
            id="Rectangle 159"
          />
        </g>
      </g>
    );
  }
}
