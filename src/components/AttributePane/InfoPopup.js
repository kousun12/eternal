// @flow

import React, { type Node } from 'react';

import { Popover, PopoverInteractionKind } from '@blueprintjs/core';

type P = {
  anchor: Node,
  content: Node,
  contentDesc?: string,
  interactionKind?: string,
};

export default (p: P) => (
  <Popover
    hoverCloseDelay={56}
    hoverOpenDelay={50}
    interactionKind={p.interactionKind || PopoverInteractionKind.HOVER}
    popoverClassName="bp3-popover-content-sizing"
    className="bp3-dark"
    transitionDuration={48}>
    {p.anchor}
    <div className="bp3-dark attr-help-content ignore-react-onclickoutside">
      {p.contentDesc && <div className="attr-pop-content-header">{p.contentDesc}</div>}
      <div>{p.content}</div>
    </div>
  </Popover>
);
