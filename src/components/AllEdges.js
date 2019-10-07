// @flow
import React from 'react';
import { connect } from 'react-redux';
import { get, fromPairs } from 'lodash';
import { inOffset, outOffset } from 'components/util';
import SVGComponent from 'components/SVGComponent';
import Spline from 'components/Spline';
import type { NodeInSpace, Pos } from 'types';
import type Edge from 'models/Edge';

type P = {
  nodes: NodeInSpace[],
  mousePos: ?Pos,
  dragging: boolean,
  source: ?[string, number],
  visible: boolean,
  paneId: ?string,
  selected: { [string]: boolean },
  onRemoveConnector: Edge => void,
  edges: Edge[],
};
const AllEdges = ({
  nodes,
  mousePos,
  dragging,
  source,
  visible,
  paneId,
  selected,
  onRemoveConnector,
  edges,
}: P) => {
  if (!visible) {
    return null;
  }
  let activeSpline = null;
  const nodeIds = paneId ? { ...selected, [paneId]: true } : selected;
  const byId = fromPairs(nodes.map(n => [n.node.id, n]));
  if (dragging && source) {
    const [nodeId, outIdx] = source;
    let src = byId[nodeId];
    activeSpline = <Spline start={outOffset(src.pos.x, src.pos.y, outIdx)} end={mousePos} />;
  }
  return (
    <SVGComponent height="100%" width="100%">
      {edges.map(e => {
        const frm = byId[e.from.id];
        const to = byId[e.to.id];
        const highlighted = nodeIds[e.from.id] || nodeIds[e.to.id];
        const start = outOffset(frm.pos.x, frm.pos.y, frm.node.outKeys().indexOf(e.fromPort));
        const end = inOffset(to.pos.x, to.pos.y, to.node.inKeys().indexOf(e.toPort));
        return (
          <Spline
            highlighted={highlighted}
            edge={e}
            start={start}
            end={end}
            key={`${e.id}-spline`}
            onRemove={() => onRemoveConnector(e)}
          />
        );
      })}
      {activeSpline}
    </SVGComponent>
  );
};

export default connect(s => ({ paneId: get(s.graph.infoOpen, 'id') }))(AllEdges);
