// @flow

import './boot';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { Hotkey, Hotkeys, HotkeysTarget, setHotkeysDialogProps } from '@blueprintjs/core';

import 'font-awesome/css/font-awesome.css';
import 'font-awesome/scss/font-awesome.scss';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/select/lib/css/blueprint-select.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

import NodeGraph from 'components/NodeGraph';
import AttributePane from 'components/AttributePane';
import Searcher from 'components/SearchBar';
import type { GraphSerialization } from 'models/Graph';
import Graph from 'models/Graph';
import type { AnyNode } from 'models/NodeBase';
import { downloadObj } from 'helpers';
import FileUpload from 'components/FileUpload';
import SaveDialog from 'components/SaveDialog';
import NodeSearcher from 'components/NodeSearcher';
import ExampleSearch, { examples } from 'components/ExampleSearch';
import './docgen';

import 'eternal.scss';
import type { Pos } from 'types';
import Toolbar from 'components/Toolbar';
import LoadPrompt from 'components/dialogs/LoadPrompt';
import { setInfoOpen as _setInfoOpen, showNode } from 'redux/ducks/graph';

const welcomeGraph = require('models/examples/welcome.json');

type P = { setInfoOpen: (?string) => void, showNode: ?string };
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

class App extends Component<P, S> {
  nodeIndex: number = 0;
  mostRecentNode: ?AnyNode = null;
  fileUpload: ?FileUpload;
  _mousePos: Pos = defaultNodePos;
  _insertPos: ?Pos = null;

  constructor(p: P) {
    super(p);
    this.state = {
      searchOpen: false,
      saveOpen: false,
      graph: null,
      searchingNodes: false,
      visible: true,
      searchingExamples: false,
      promptLoad: null,
    };
  }

  componentDidMount() {
    const exId = get(window.location.search.match(/[?&]e=([\w-\d% +]+)&?/), 1);
    if (exId) {
      const name = decodeURIComponent(exId).replace(/\+/g, ' ');
      if (examples.find(e => e.name === name)) {
        this.setState({ promptLoad: name });
      }
    }

    this._setGraph(Graph.load(welcomeGraph));

    const hide = get(window.location.search.match(/[?&]h=(\d)&?/), 1);
    if (typeof hide === 'string') {
      const visible = hide === '0';
      this.setState({ visible });
    }

    const debug = get(window.location.search.match(/[?&]d=(\d)&?/), 1);
    if (typeof debug === 'string') {
      if (debug === '1') {
        this._toggleDebug();
      }
    }
    window['$debug'] = true;
    document.addEventListener('mousemove', this._onMouseMove);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this._onMouseMove);
  }

  _onMouseMove = (me: MouseEvent) => {
    this._mousePos = { x: me.clientX, y: me.clientY };
  };

  _setGraph = (graph: Graph) => {
    this.state.graph && this.state.graph.dispose();
    window['$node'] = null;
    this.setState({ graph: null }, () => {
      this.mostRecentNode = get(graph.nodes, [0, 'node']);
      const readme = graph.nodes.find(nis => nis.node.title === 'README');
      this._setInfoOpen(readme ? readme.node.id : null);
      this.setState({ graph }, () => (window['$graph'] = graph));
    });
  };

  _setInfoOpen = (id: ?string) => this.props.showNode !== id && this.props.setInfoOpen(id);
  _onSearch = () => !this.state.searchOpen && this.setState({ searchOpen: true });

  _searchExamples = () =>
    !this.state.searchingExamples && this.setState({ searchingExamples: true });

  _exportJSON = (name: string) => {
    const { graph } = this.state;
    graph && downloadObj(graph.serialize(name), name);
    this._closeSave();
  };

  _loadJSON = () => this.fileUpload && this.fileUpload.openFileInput();

  _onFileUpload = (file: File) => Graph.fromFile(file, this._loadGraph);

  _loadGraph = (json: GraphSerialization) => {
    const exId = get(window.location.search.match(/[?&]e=([\w-\d% +]+)&?/), 1);
    if (exId) {
      this._reload();
    } else {
      this._setGraph(Graph.load(json));
    }
  };

  _loadExample = (json: GraphSerialization) => {
    window.location.search = `?e=${encodeURIComponent((json.name || '').replace(/ /g, '+'))}`;
  };

  _toggleDebug = () => {
    window['$debug'] = !window['$debug'];
    this.setState({ visible: false }, () => this.setState({ visible: true }));
  };

  _addNode = (cls: Class<AnyNode>) => {
    const { graph } = this.state;
    this.setState({ searchOpen: false });
    if (graph) {
      const node = new cls();
      graph.addNode(node, this._insertPos || this._mousePos);
      this._onNodeSelect(node);
    }
    this._insertPos = null;
  };

  _onNodeSelect = (node: ?AnyNode, idx?: number) => {
    this._setInfoOpen(get(node, 'id', null));
    const _node = node;
    if (_node) {
      this.mostRecentNode = _node;
      if (typeof idx === 'number') {
        this.nodeIndex = idx;
      }
      window['$node'] = node;
    }
    this.state.searchingNodes && this._closeSearch();
  };

  _closeSearch = () =>
    this.setState({ searchOpen: false, searchingNodes: false, searchingExamples: false });
  _closeSave = () => this.setState({ saveOpen: false });
  _showSave = () => this.setState({ saveOpen: true });
  _showNodeSearch = () => this.setState({ searchingNodes: true });
  _toggleGraph = () => this.setState({ visible: !this.state.visible });

  _loadUrl = () => {
    const { promptLoad } = this.state;
    if (promptLoad) {
      const serialization = examples.find(e => e.name === promptLoad);
      serialization && this._setGraph(Graph.load(serialization));
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

  _closePrompt = () => {
    this.setState({ promptLoad: null });
    this._reload();
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
        />
        {graph && (
          <NodeGraph visible={visible} graph={graph} onNodeSelectionChange={this._onNodeSelect} />
        )}
        <AttributePane node={inPane} />
        {saveOpen && (
          <SaveDialog
            initial={title}
            isOpen={saveOpen}
            handleClose={this._closeSave}
            saveFile={this._exportJSON}
          />
        )}
        <Searcher isOpen={searchOpen} onItemSelect={this._addNode} onClose={this._closeSearch} />
        {graph && (
          <NodeSearcher
            isOpen={searchingNodes}
            onItemSelect={this._onNodeSelect}
            onClose={this._closeSearch}
            graph={graph}
          />
        )}
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

  _manualInsert = () => {
    this._onSearch();
    this._insertPos = defaultNodePos;
  };

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
        <Hotkey global combo="shift + meta + x" label="Clear All" onKeyDown={this._reload} />
        <Hotkey global combo="alt + d" label="Debug Mode" onKeyDown={this._toggleDebug} />
        <Hotkey global combo="j" label="Next Node" onKeyDown={this._nextNode} />
        <Hotkey global combo="k" label="Prev Node" onKeyDown={this._prevNode} />
      </Hotkeys>
    );
  }
}

setHotkeysDialogProps({ className: 'bp3-dark', globalHotkeysGroup: 'Menu' });
const AppWithHK = HotkeysTarget(App);
export default connect(
  showNode,
  d => ({ setInfoOpen: n => d(_setInfoOpen(n)) })
)(AppWithHK);
