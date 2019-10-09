// @flow
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'redux-starter-kit';
import { inOffset, outOffset } from 'components/util';
import SVGComponent from 'components/SVGComponent';
import Spline from 'components/Spline';
import { selectInfoOpen, selectPositions } from 'redux/ducks/graph';
import type { Pos } from 'types';
import type Edge from 'models/Edge';
import { addVec } from 'utils/vector';
import type { PosMemo } from 'redux/ducks/graph';
import type Graph from 'models/Graph';

type P = {
  mousePos: ?Pos,
  dragging: boolean,
  source: ?[string, number],
  visible: boolean,
  paneId: ?string,
  selected: { [string]: boolean },
  onRemoveConnector: Edge => void,
  edges: Edge[],
  pan: Pos,
  positions: PosMemo,
  graph: Graph,
};
const AllEdges = ({
  positions,
  mousePos,
  dragging,
  source,
  visible,
  paneId,
  selected,
  onRemoveConnector,
  edges,
  pan,
  graph,
}: P) => {
  if (!visible) {
    return null;
  }
  let activeSpline = null;
  const nodeIds = paneId ? { ...selected, [paneId]: true } : selected;
  // const byId = fromPairs(nodes.map(n => [n.node.id, n])); // TODO memoize up a level
  if (dragging && source) {
    const [nodeId, outIdx] = source;
    let src = positions[nodeId];
    activeSpline = <Spline start={outOffset(src.x, src.y, outIdx)} end={mousePos} />;
  }
  return (
    <SVGComponent height="100%" width="100%">
      {edges.map(e => {
        const _out = graph.nodeWithIdF(e.from.id);
        const outIdx = _out.node.outKeys().indexOf(e.fromPort);
        const _in = graph.nodeWithIdF(e.to.id);
        const inIdx = _in.node.inKeys().indexOf(e.toPort);
        const frm = positions[e.from.id] || _out.pos;
        const to = positions[e.to.id] || _in.pos;
        return (
          <Spline
            highlighted={nodeIds[e.from.id] || nodeIds[e.to.id]}
            edge={e}
            start={addVec(outOffset(frm.x, frm.y, outIdx), pan)}
            end={addVec(inOffset(to.x, to.y, inIdx), pan)}
            key={`${e.id}-spline`}
            onRemove={() => onRemoveConnector(e)}
          />
        );
      })}
      {activeSpline}
    </SVGComponent>
  );
};

const selector = createSelector(
  [selectInfoOpen, selectPositions],
  (paneId, positions) => ({ paneId, positions })
);

export default connect(selector)(AllEdges);
