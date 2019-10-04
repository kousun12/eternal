// @flow

import React from 'react';
import { AnchorButton, Tooltip } from '@blueprintjs/core';

type P = {
  loadExample: () => void,
  insertNode: () => void,
  toggleVis: () => void,
  graphVisible: boolean,
  toggleDebug: () => void,
  exportJSON: () => void,
  loadJSON: () => void,
  title: string,
  toggleInfo: () => void,
  infoShowing: boolean,
};
export default ({
  loadExample,
  insertNode,
  toggleVis,
  graphVisible,
  toggleDebug,
  exportJSON,
  loadJSON,
  title,
  toggleInfo,
  infoShowing,
}: P) => {
  return (
    <div className="graph-toolbar ignore-react-onclickoutside">
      <div style={{ ...styles.toolSection, ...styles.leftAlign }}>
        <Tooltip content="load an example">
          <AnchorButton minimal icon="folder-shared-open" large onClick={loadExample} />
        </Tooltip>
        <Tooltip content="insert a new node">
          <AnchorButton minimal icon="new-link" large onClick={insertNode} />
        </Tooltip>
        <Tooltip content={`${graphVisible ? 'hide' : 'show'} graph`}>
          <AnchorButton
            minimal
            icon={graphVisible ? 'eye-open' : 'eye-off'}
            large
            onClick={toggleVis}
          />
        </Tooltip>
        <Tooltip content="toggle debug mode">
          <AnchorButton minimal icon="build" large onClick={toggleDebug} />
        </Tooltip>
        <Tooltip content="export graph as JSON">
          <AnchorButton minimal icon="download" large onClick={exportJSON} />
        </Tooltip>
        <Tooltip content="open JSON file">
          <AnchorButton minimal icon="upload" large onClick={loadJSON} />
        </Tooltip>
        <Tooltip content="node list API docs">
          <AnchorButton
            minimal
            icon="panel-stats"
            large
            href="https://github.com/kousun12/eternal/blob/master/docs.md"
            target="_blank"
          />
        </Tooltip>
      </div>
      <h2 className="graph-title">{title}</h2>
      <div style={{ ...styles.toolSection, ...styles.rightAlign }}>
        <Tooltip content="open github repo">
          <AnchorButton
            minimal
            icon="git-repo"
            large
            href="https://github.com/kousun12/eternal"
            target="_blank"
          />
        </Tooltip>
        <Tooltip content="show keyboard shortcuts">
          <AnchorButton minimal icon="key-command" large onClick={_showHotKeys} />
        </Tooltip>
        <Tooltip content={`${infoShowing ? 'hide' : 'show'} info pane`}>
          <AnchorButton
            minimal
            icon={`chevron-${infoShowing ? 'right' : 'left'}`}
            large
            onClick={toggleInfo}
          />
        </Tooltip>
      </div>
    </div>
  );
};

const _showHotKeys = () => {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { which: 47, keyCode: 47, shiftKey: true, bubbles: true })
  );
};

const styles = {
  toolSection: { flex: 1, display: 'flex' },
  leftAlign: { justifyContent: 'flex-start' },
  rightAlign: { justifyContent: 'flex-end' },
};
