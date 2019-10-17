// @flow

import React from 'react';
import { createSelector } from 'redux-starter-kit';
import { AnchorButton, Tooltip } from '@blueprintjs/core';
import { connect } from 'react-redux';
import { selectInfoOpen } from 'redux/ducks/graph';
import EditInput from 'components/EditInput';

type P = {
  loadExample: () => any,
  insertNode: () => any,
  toggleVis: () => any,
  graphVisible: boolean,
  toggleDebug: () => any,
  exportJSON: () => any,
  loadJSON: () => any,
  title: string,
  toggleInfo: () => any,
  infoShowing: boolean,
  reBake: () => any,
  setTitle: string => any,
};
const Toolbar = ({
  loadExample,
  insertNode,
  toggleVis,
  graphVisible,
  exportJSON,
  loadJSON,
  title,
  toggleInfo,
  infoShowing,
  reBake,
  setTitle,
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
        <Tooltip content="clean & rerun">
          <AnchorButton minimal icon="clean" large onClick={reBake} />
        </Tooltip>
        <Tooltip content="clear everything">
          <AnchorButton minimal icon="reset" large onClick={_reload} />
        </Tooltip>
        <Tooltip content="export graph as JSON">
          <AnchorButton minimal icon="download" large onClick={exportJSON} />
        </Tooltip>
        <Tooltip content="open JSON file">
          <AnchorButton minimal icon="upload" large onClick={loadJSON} />
        </Tooltip>
      </div>
      <EditInput value={title} onChange={setTitle} style={styles.title} />
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
        <Tooltip content="node API docs">
          <AnchorButton
            minimal
            icon="panel-stats"
            large
            href="https://github.com/kousun12/eternal/blob/master/docs.md"
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

const _reload = () => window.location.replace('/');

const selector = createSelector(
  [selectInfoOpen],
  i => ({ infoShowing: Boolean(i) })
);

export default connect(selector)(Toolbar);

const _showHotKeys = () => {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { which: 47, keyCode: 47, shiftKey: true, bubbles: true })
  );
};

const styles = {
  toolSection: { flex: 1, display: 'flex', alignItems: 'center' },
  leftAlign: { justifyContent: 'flex-start' },
  rightAlign: { justifyContent: 'flex-end' },
  title: { fontSize: 16 },
};
