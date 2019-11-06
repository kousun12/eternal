// @flow

import './boot';
import React from 'react';

import { connect } from 'react-redux';
import { createSelector } from 'redux-starter-kit';
import { get, throttle } from 'lodash';
import { Hotkey, Hotkeys, HotkeysTarget, setHotkeysDialogProps } from '@blueprintjs/core';

import 'eternal.scss';
import 'font-awesome/css/font-awesome.css';
import 'font-awesome/scss/font-awesome.scss';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

import NodeGraph from 'components/NodeGraph';
import AttributePane from 'components/AttributePane';
import Searcher from 'components/SearchBar';
import type { GraphSerialization } from 'models/Graph';
import Graph from 'models/Graph';
import type { AnyNode } from 'models/NodeBase';
import { downloadObj } from 'utils';
import FileUpload from 'components/FileUpload';
import SaveDialog from 'components/SaveDialog';
import NodeSearcher from 'components/NodeSearcher';
import ExampleSearch, { examples } from 'components/ExampleSearch';

import type { Pos } from 'types';
import Toolbar from 'components/Toolbar';
import LoadPrompt from 'components/dialogs/LoadPrompt';
import {
  setInfoOpen as _setInfoOpen,
  selectInfoOpen,
  updatePos as _updatePos,
  selectView,
  setScale as _setScale,
  selSet as _selSet,
} from 'redux/ducks/graph';
import Zoomer from 'components/Zoomer';
import type { PosMemo, SelectedView } from 'redux/ducks/graph';
import { subVec } from 'utils/vector';
import { urlRe } from 'utils/url';
import { worldToGraph } from 'components/util';

const welcomeGraph = require('models/examples/welcome.json');

type P = {
  setInfoOpen: (?string) => void,
  showNode: ?string,
  updatePos: PosMemo => void,
  view: SelectedView,
  setScale: number => void,
  selSet: (string[]) => void,
};
type S = {
  graph: ?Graph,
  searchOpen: boolean,
  saveOpen: boolean,
  searchingNodes: boolean,
  searchingExamples: boolean,
  visible: boolean,
  promptLoad: ?string,
};

const defaultNodePos = { x: 70, y: 120 };

class App extends React.PureComponent<P, S> {
  nodeIndex: number = 0;
  mostRecentNode: ?AnyNode = null;
  fileUpload: ?FileUpload;
  _mousePos: Pos = defaultNodePos;
  _insertPos: ?Pos = null;
  state = {
    searchOpen: false,
    saveOpen: false,
    graph: null,
    searchingNodes: false,
    visible: true,
    searchingExamples: false,
    promptLoad: null,
  };

  componentDidMount() {
    let showWelcome = true;
    const fromSession = sessionStorage.getItem('graph');
    if (fromSession) {
      const gs = Graph.serialization(JSON.parse(fromSession));
      const g = gs && Graph.load(gs);
      if (g) {
        showWelcome = false;
        this._setGraph(g);
        sessionStorage.removeItem('graph');
      }
    }
    const exId = this._paramFor(urlRe.exId);
    if (exId) {
      const name = decodeURIComponent(exId).replace(/\+/g, ' ');
      const exFromUrl = examples.find(e => e.name === name);
      if (exFromUrl) {
        showWelcome = false;
        if (process.env.NODE_ENV === 'development') {
          this._loadUrl(exFromUrl);
        } else {
          this.setState({ promptLoad: name });
        }
      }
    }
    showWelcome && this._setGraph(Graph.load(welcomeGraph));

    const hide = this._paramFor(urlRe.hide);
    typeof hide === 'string' && this._setVisible(hide === '0');

    const debug = this._paramFor(urlRe.debug);
    typeof debug === 'string' && debug === '1' && this._toggleDebug();

    document.addEventListener('mousemove', this._onMouseMove);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this._onMouseMove);
  }

  _setVisible = (visible: boolean) => {
    this.setState({ visible });
    if (!visible) {
      document.getElementById('eternal-root').className = 'hide';
    } else {
      document.getElementById('eternal-root').className = '';
    }
  };

  _paramFor = (re: RegExp): any => get(window.location.search.match(re), 1);

  _onMouseMove = throttle((me: MouseEvent) => {
    this._mousePos = { x: me.clientX, y: me.clientY };
  }, 30);

  _setGraph = (graph: Graph) => {
    this.state.graph && this.state.graph.dispose();
    window.$node = null;
    this.setState({ graph: null }, () => {
      this.mostRecentNode = get(graph.nodes, [0, 'node']);
      if (process.env.NODE_ENV === 'production') {
        const readme = graph.nodes.find(nis => nis.node.title === 'README');
        this._setInfoOpen(readme ? readme.node.id : null);
      }
      if (typeof graph.meta.zoom === 'number') {
        this.props.setScale(graph.meta.zoom);
      }
      this.setState({ graph }, () => (window.$graph = graph));
    });
  };

  _setInfoOpen = (id: ?string) => this.props.showNode !== id && this.props.setInfoOpen(id);
  _onSearch = () => !this.state.searchOpen && this.setState({ searchOpen: true });

  _searchExamples = () =>
    !this.state.searchingExamples && this.setState({ searchingExamples: true });

  _exportJSON = (name: string) => {
    const gs = this._getSerialization(name);
    gs && downloadObj(gs, gs.name || name);
    this._closeSave();
  };

  _getSerialization = (name?: string): ?GraphSerialization => {
    const { graph } = this.state;
    const {
      view: { zoom },
    } = this.props;
    return graph && graph.serialize(name || graph.name, { zoom });
  };

  _loadJSON = () => this.fileUpload && this.fileUpload.openFileInput();

  _onFileUpload = (file: File) => Graph.fromFile(file, this._loadGraph);

  _loadGraph = (json: GraphSerialization) => {
    const exId = this._paramFor(urlRe.exId);
    if (exId) {
      this._reload();
    } else {
      this._setGraph(Graph.load(json));
    }
  };

  _loadExample = (json: GraphSerialization) => {
    sessionStorage.setItem('graph', JSON.stringify(json));
    window.location.replace('/');
  };

  _toggleDebug = () => {
    window.$debug = !window.$debug;
    this.setState({ visible: false }, () => this.setState({ visible: true }));
  };

  _addNode = (cls: Class<AnyNode>) => {
    const { graph } = this.state;
    const { view, updatePos, showNode, selSet } = this.props;
    this.setState({ searchOpen: false });
    if (graph) {
      const node = new cls();
      const pos =
        this._insertPos ||
        subVec(worldToGraph(this._mousePos, view.scaleInverse), { x: 30, y: 30 });
      graph.addNode(node, pos);
      // only show node info if pane is already open
      if (showNode) {
        this._onNodeSelect(node);
      } else {
        this._setNode(node);
      }
      selSet([node.id]);
      updatePos({ [node.id]: pos });
    }
    this._insertPos = null;
  };

  _onNodeSelect = (node: ?AnyNode, idx?: number) => {
    this._setInfoOpen(get(node, 'id', null));
    this._setNode(node, idx);
    this.state.searchingNodes && this._closeSearch();
  };

  _setNode = (node: ?AnyNode, idx?: number) => {
    const _node = node;
    if (_node) {
      this.mostRecentNode = _node;
      if (typeof idx === 'number') {
        this.nodeIndex = idx;
      }
      window.$node = node;
    }
  };

  _closeSearch = () =>
    this.setState({ searchOpen: false, searchingNodes: false, searchingExamples: false });
  _closeSave = () => this.setState({ saveOpen: false });
  _showSave = () => this.setState({ saveOpen: true });
  _showNodeSearch = () => this.setState({ searchingNodes: true });
  _toggleGraph = () => this._setVisible(!this.state.visible);

  _loadUrl = (example?: GraphSerialization) => {
    const { promptLoad } = this.state;
    const exJson = Graph.serialization(example);
    if (exJson || promptLoad) {
      const json = exJson || examples.find(e => e.name === promptLoad);
      json && this._setGraph(Graph.load(json));
    }
    this.setState({ promptLoad: null });
  };

  _nextNode = () => {
    if (!this.props.showNode) return;
    const nodes = get(this.state.graph, 'nodes', []);
    if (nodes.length < 2) return;
    this.nodeIndex = (this.nodeIndex + 1) % nodes.length;
    this._onNodeSelect(nodes[this.nodeIndex].node);
  };

  _prevNode = () => {
    if (!this.props.showNode) return;
    const nodes = get(this.state.graph, 'nodes', []);
    if (nodes.length < 2) return;
    this.nodeIndex = (((this.nodeIndex - 1) % nodes.length) + nodes.length) % nodes.length;
    this._onNodeSelect(nodes[this.nodeIndex].node);
  };

  _toggleInfo = () =>
    this.props.setInfoOpen(this.props.showNode ? null : get(this.mostRecentNode, 'id'));

  _reload = () => window.location.replace('/');

  _saveGraphToSession = () =>
    sessionStorage.setItem('graph', JSON.stringify(this._getSerialization()));

  _reBake = () => {
    this._saveGraphToSession();
    window.location.replace('/');
  };

  _closePrompt = () => {
    this.setState({ promptLoad: null });
    this._reload();
  };

  _setName = (name: string) => {
    const { graph } = this.state;
    if (graph) {
      graph.setName(name);
      this.setState({ graph });
    }
  };

  _manualInsert = () => {
    this._onSearch();
    this._insertPos = defaultNodePos;
  };

  render() {
    const {
      graph,
      searchOpen,
      saveOpen,
      searchingNodes,
      visible,
      searchingExamples,
      promptLoad,
    } = this.state;
    const { showNode } = this.props;
    const title = get(graph, 'name', '');
    const inPane = showNode && graph ? get(graph.nodeWithId(showNode), 'node', null) : null;
    return (
      <>
        <Toolbar
          loadExample={this._searchExamples}
          insertNode={this._manualInsert}
          toggleVis={this._toggleGraph}
          graphVisible={visible}
          toggleDebug={this._toggleDebug}
          exportJSON={this._showSave}
          loadJSON={this._loadJSON}
          title={title}
          toggleInfo={this._toggleInfo}
          reBake={this._reBake}
          setTitle={this._setName}
        />
        {graph && (
          <NodeGraph visible={visible} graph={graph} onNodeSelectionChange={this._onNodeSelect} />
        )}
        <AttributePane node={visible ? inPane : null} />
        {visible && <Zoomer />}
        {saveOpen && (
          <SaveDialog
            initial={title}
            isOpen={saveOpen}
            handleClose={this._closeSave}
            saveFile={this._exportJSON}
          />
        )}
        {graph && (
          <NodeSearcher
            isOpen={searchingNodes}
            onItemSelect={this._onNodeSelect}
            onClose={this._closeSearch}
            graph={graph}
          />
        )}
        <Searcher isOpen={searchOpen} onItemSelect={this._addNode} onClose={this._closeSearch} />
        <ExampleSearch
          isOpen={searchingExamples}
          onItemSelect={this._loadExample}
          onClose={this._closeSearch}
        />
        {promptLoad && (
          <LoadPrompt onClose={this._closePrompt} title={promptLoad} load={this._loadUrl} />
        )}
        <FileUpload onFile={this._onFileUpload} ref={r => (this.fileUpload = r)} />
      </>
    );
  }

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    // NB for some reason moving this to a component doesn't work
    return this.state.promptLoad ? (
      <Hotkeys>
        <Hotkey global combo="enter" label="Load Example" onKeyDown={this._loadUrl} />
      </Hotkeys>
    ) : (
      <Hotkeys>
        <Hotkey
          global
          combo="alt + e"
          label="Load an Example..."
          onKeyDown={this._searchExamples}
        />
        <Hotkey global combo="meta + k" label="Add Node" onKeyDown={this._onSearch} />
        <Hotkey global combo="esc" label="Info Pane (show / hide)" onKeyDown={this._toggleInfo} />
        <Hotkey
          global
          combo="shift + meta + v"
          label="Graph (show / hide)"
          onKeyDown={this._toggleGraph}
        />
        <Hotkey
          global
          combo="shift + meta + f"
          label="Search existing nodes"
          onKeyDown={this._showNodeSearch}
        />
        <Hotkey global combo="shift + meta + s" label="Export as JSON" onKeyDown={this._showSave} />
        <Hotkey global combo="shift + meta + o" label="Load from JSON" onKeyDown={this._loadJSON} />
        <Hotkey global combo="alt + r" label="Clean & Rerun" onKeyDown={this._reBake} />
        <Hotkey global combo="shift + meta + x" label="Clear Everything" onKeyDown={this._reload} />
        <Hotkey global combo="alt + d" label="Debug Mode" onKeyDown={this._toggleDebug} />
        <Hotkey global combo="j" label="Next Node" onKeyDown={this._nextNode} group="Selection" />
        <Hotkey global combo="k" label="Prev Node" onKeyDown={this._prevNode} group="Selection" />
      </Hotkeys>
    );
  }
}

setHotkeysDialogProps({ className: 'bp3-dark', globalHotkeysGroup: 'Menu' });
const AppWithHK = HotkeysTarget(App);
const select = createSelector(
  [selectInfoOpen, selectView],
  (showNode, view) => ({ showNode, view })
);
export default connect(
  select,
  d => ({
    setInfoOpen: n => d(_setInfoOpen(n)),
    updatePos: (pos: PosMemo) => d(_updatePos(pos)),
    setScale: s => d(_setScale(s)),
    selSet: id => d(_selSet(id)),
  })
)(AppWithHK);
