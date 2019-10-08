import { zooms } from 'redux/ducks/graph';
import { connect } from 'react-redux';

const _zoomOptions = zooms.map(scale => ({ value: scale, label: `${(scale * 100).toFixed(0)}%` }));

type P = {||};
const Zoomer = ({  }: P) => {};

export default connect(s => ({ zoom: s.graph.view.zoom }))(Zoomer);
