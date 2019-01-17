// @flow

import './boot';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { get } from 'lodash';
import {
  HotkeysTarget,
  Hotkeys,
  Hotkey,
  setHotkeysDialogProps,
  Dialog,
  Button,
  Classes,
} from '@blueprintjs/core';

import 'font-awesome/css/font-awesome.css';
import 'font-awesome/scss/font-awesome.scss';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/select/lib/css/blueprint-select.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

import NodeGraph from 'components/NodeGraph';
import AttributePane from 'components/AttributePane';
import Searcher from 'components/SearchBar';
import Graph from 'models/Graph';
import type { AnyNode } from 'models/NodeBase';
import { downloadObj } from 'helpers';
import FileUpload from 'components/FileUpload';
import SaveDialog from 'components/SaveDialog';
import NodeSearcher from 'components/NodeSearcher';
import ExampleSearch, { examples } from 'components/ExampleSearch';

import 'eternal.scss';
import type { GraphSerialization } from 'models/Graph';
const welcomeGraph = require('models/examples/welcome.json');

type P = {};
type S = {
  graph: ?Graph,
  searchOpen: boolean,
  selectedNode: ?AnyNode,
  saveOpen: boolean,
  searchingNodes: boolean,
  searchingExamples: boolean,
  visible: boolean,
  promptLoad: ?string,
};

class App extends Component<P, S> {
  nodeIndex: number = 0;
  mostRecentNode: ?AnyNode = null;
  fileUpload: ?FileUpload;

  constructor(p: P) {
    super(p);
    this.state = {
      searchOpen: false,
      selectedNode: null,
      saveOpen: false,
      graph: null,
      searchingNodes: false,
      visible: true,
      searchingExamples: false,
      promptLoad: null,
    };
  }

  componentDidMount() {
    let serialization = welcomeGraph;
    const exId = get(window.location.search.match(/[?&]e=([\w-\d% +]+)&?/), 1);
    if (exId) {
      const name = decodeURIComponent(exId).replace(/\+/g, ' ');
      if (examples.find(e => e.name === name)) {
        this.setState({ promptLoad: name });
      }
    }
    this._setGraph(Graph.load(serialization));

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
  }

  _setGraph = (graph: Graph) => {
    if (this.state.graph) {
      this.state.graph.dispose();
    }
    window['$node'] = null;
    this.mostRecentNode = get(graph.nodes, [0, 'node']);
    const readme = graph.nodes.find(nis => nis.node.title === 'README')
    const selectedNode = readme ? readme.node : null
    this.setState({ graph, selectedNode }, () => (window['$graph'] = graph));
  };

  _onSearch = () => {
    if (!this.state.searchOpen) {
      this.setState({ searchOpen: true });
    }
  };

  _searchExamples = () => {
    if (!this.state.searchingExamples) {
      this.setState({ searchingExamples: true });
    }
  };

  _exportJSON = (name: string) => {
    const { graph } = this.state;
    graph && downloadObj(graph.serialize(name), name);
    this._closeSave();
  };

  _loadJSON = () => {
    this.fileUpload && this.fileUpload.openFileInput();
  };

  _onFileUpload = (file: File) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result;
      if (typeof result === 'string') {
        try {
          this._loadGraph(JSON.parse(result));
        } catch (e) {
          console.error('could not load graph', e);
        }
      }
    };
    fileReader.readAsText(file);
  };

  _loadGraph = (json: GraphSerialization) => {
    this._setGraph(Graph.load(json));
    this._closeSearch();
  };

  _toggleDebug = () => {
    window['$debug'] = !window['$debug'];
    console.log('debug mode', window['$debug']);
    this.setState({ visible: false }, () => this.setState({ visible: true }));
  };

  _addNode = (cls: Class<AnyNode>) => {
    const { graph } = this.state;
    this.setState({ searchOpen: false });
    graph && graph.addNode(new cls(), { x: 50, y: 50 });
  };

  _onNodeSelect = (node: ?AnyNode) => {
    const selectedNode = node;
    const { graph } = this.state;
    this.setState({ selectedNode, visible: false }, () => this.setState({ visible: true }));
    if (selectedNode) {
      this.mostRecentNode = selectedNode;
      this.nodeIndex = graph ? graph.nodes.findIndex(n => n.node.id === selectedNode.id) : 0;
      window['$node'] = selectedNode;
    }
    if (this.state.searchingNodes) {
      this._closeSearch();
    }
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
    if (!this.state.selectedNode) return;
    const nodes = get(this.state.graph, 'nodes', []);
    if (nodes.length < 2) return;
    this.nodeIndex = (this.nodeIndex + 1) % nodes.length;
    this._onNodeSelect(nodes[this.nodeIndex].node);
  };

  _prevNode = () => {
    if (!this.state.selectedNode) return;
    const nodes = get(this.state.graph, 'nodes', []);
    if (nodes.length < 2) return;
    this.nodeIndex = (((this.nodeIndex - 1) % nodes.length) + nodes.length) % nodes.length;
    this._onNodeSelect(nodes[this.nodeIndex].node);
  };

  _toggleInfo = () => {
    if (this.state.selectedNode) {
      this.setState({ selectedNode: null });
    } else {
      this.setState({ selectedNode: this.mostRecentNode });
    }
  };

  render() {
    const {
      selectedNode,
      graph,
      searchOpen,
      saveOpen,
      searchingNodes,
      visible,
      searchingExamples,
      promptLoad,
    } = this.state;
    return (
      <>
        {graph && (
          <NodeGraph
            visible={visible}
            graph={graph}
            onNodeSelectionChange={this._onNodeSelect}
            paneId={get(selectedNode, 'id')}
          />
        )}
        {selectedNode && <AttributePane node={selectedNode} />}
        {saveOpen && (
          <SaveDialog
            initial={get(graph, 'name')}
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
          onItemSelect={this._loadGraph}
          onClose={this._closeSearch}
        />
        {promptLoad && (
          <Dialog isOpen={true} className="bp3-dark" title='Load...'>
            <div className={Classes.DIALOG_FOOTER}>
              <div className={Classes.DIALOG_BODY}>
                <p>you are about to load</p>
                <p>
                  ~{promptLoad}~
                </p>
              </div>
              <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                <Button onClick={this._loadUrl}>👾 ok, computer</Button>
              </div>
            </div>
          </Dialog>
        )}
        <FileUpload onFile={this._onFileUpload} ref={r => (this.fileUpload = r)} />
        <h2 className="graph-title">{get(graph, 'name', '')}</h2>
      </>
    );
  }

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    return (
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
        <Hotkey global combo="alt + d" label="Debug Mode" onKeyDown={this._toggleDebug} />
        <Hotkey global combo="j" label="Next Node" onKeyDown={this._nextNode} />
        <Hotkey global combo="k" label="Prev Node" onKeyDown={this._prevNode} />
      </Hotkeys>
    );
  }
}

setHotkeysDialogProps({ className: 'bp3-dark', globalHotkeysGroup: 'Menu' });
const AppWithHK = HotkeysTarget(App);

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<AppWithHK className="bp3-dark" />, document.getElementById('eternal-root'));
});

export default AppWithHK;
