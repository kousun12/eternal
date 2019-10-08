// @flow
import React from 'react';
import { zooms, setScale as _setScale } from 'redux/ducks/graph';
import { connect } from 'react-redux';
import { Slider } from '@blueprintjs/core';

type P = {| zoom: number, setScale: number => void |};

const Zoomer = ({ zoom, setScale }: P) => {
  return (
    <div className="zoomer">
      <Slider
        className="bp3-dark"
        min={0}
        max={zooms.length - 1}
        stepSize={1}
        labelStepSize={5}
        onChange={setScale}
        value={zoom}
        labelRenderer={v => `${zooms[v] / 100}x`}
        showTrackFill={false}
      />
    </div>
  );
};

export default connect(
  s => ({ zoom: s.graph.view.zoom }),
  d => ({ setScale: s => d(_setScale(s)) })
)(Zoomer);
