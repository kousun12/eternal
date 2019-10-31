// @flow
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'redux-starter-kit';
import { inOffset, outOffset, worldToGraph } from 'components/util';
import SVGComponent from 'components/SVGComponent';
import Spline from 'components/Spline';
import { selectInfoOpen, selectPositions } from 'redux/ducks/graph';
import type { Pos } from 'types';
import type Edge from 'models/Edge';
import { addVec } from 'utils/vector';
import type { PosMemo } from 'redux/ducks/graph';
import type Graph from 'models/Graph';

type P = {
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
  scaleInverse: number,
  mousePos: ?Pos,
};
const AllEdges = ({
  positions,
  dragging,
  source,
  visible,
  paneId,
  selected,
  onRemoveConnector,
  edges,
  pan,
  graph,
  scaleInverse,
  mousePos,
}: P) => {
  if (!visible) {
    return null;
  }
  let creatingSpline = null;
  if (dragging && source && mousePos) {
    const [nodeId, outIdx] = source;
    let src = positions[nodeId] || graph.nodeWithIdF(nodeId).pos;
    creatingSpline = (
      <Spline
        incomplete={true}
        start={addVec(outOffset(src.x, src.y, outIdx), pan)}
        end={worldToGraph(mousePos, scaleInverse)}
      />
    );
  }
  return (
    <SVGComponent height="100%" width="100%" className="edge-svg">
      {edges.map(e => {
        const [fromId, toId] = [e.from.id, e.to.id];
        const [i, o] = [graph.nodeWithIdF(toId), graph.nodeWithIdF(fromId)];

        const outIdx = o.node.constructor.outKeyIndex(e.fromPort);
        const inIdx = i.node.constructor.inKeyIndex(e.toPort);

        const frm = positions[e.from.id] || o.pos;
        const to = positions[e.to.id] || i.pos;
        return (
          <Spline
            highlighted={
              selected[fromId] ||
              selected[toId] ||
              (paneId && (fromId === paneId || toId === paneId))
            }
            edge={e}
            start={addVec(outOffset(frm.x, frm.y, outIdx), pan)}
            end={addVec(inOffset(to.x, to.y, inIdx), pan)}
            key={`${e.id}-spline`}
            onRemove={() => onRemoveConnector(e)}
          />
        );
      })}
      {creatingSpline}
    </SVGComponent>
  );
};

const selector = createSelector(
  [selectInfoOpen, selectPositions],
  (paneId, positions) => ({ paneId, positions })
);

export default connect(selector)(AllEdges);
