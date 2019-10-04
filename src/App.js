// @flow

import './boot';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { get } from 'lodash';
import {
  Button,
  Classes,
  Dialog,
  Hotkey,
  Hotkeys,
  HotkeysTarget,
  setHotkeysDialogProps,
} from '@blueprintjs/core';

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
    if (this.state.graph) {
      this.state.graph.dispose();
    }
    window['$node'] = null;
    this.setState({ graph: null }, () => {
      this.mostRecentNode = get(graph.nodes, [0, 'node']);
      const readme = graph.nodes.find(nis => nis.node.title === 'README');
      const selectedNode = readme ? readme.node : null;
      this.setState({ graph, selectedNode }, () => (window['$graph'] = graph));
    });
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

  _reload = () => window.location.replace('/');

  _toggleDebug = () => {
    window['$debug'] = !window['$debug'];
    console.log('debug mode', window['$debug']);
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

  _closeLoadPrompt = () => {
    this.setState({ promptLoad: null });
    this._reload();
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
        <Toolbar
          loadExample={this._searchExamples}
          insertNode={this._manualInsert}
          toggleVis={this._toggleGraph}
          graphVisible={visible}
          toggleDebug={this._toggleDebug}
          exportJSON={this._showSave}
          loadJSON={this._loadJSON}
          title={get(graph, 'name', '')}
          toggleInfo={this._toggleInfo}
          infoShowing={Boolean(selectedNode)}
        />
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
          onItemSelect={this._loadExample}
          onClose={this._closeSearch}
        />
        {promptLoad && (
          <Dialog
            canOutsideClickClose={false}
            isOpen={promptLoad}
            className="bp3-dark"
            title="Load..."
            onClose={this._closeLoadPrompt}
          >
            <div className={Classes.DIALOG_FOOTER}>
              <div className={Classes.DIALOG_BODY}>
                <p>you are about to load the example</p>
                <p>~{promptLoad}~</p>
              </div>
              <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                <Button onClick={this._loadUrl}>👾 ok computer</Button>
              </div>
            </div>
          </Dialog>
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
    if (this.state.promptLoad) {
      return (
        <Hotkeys>
          <Hotkey global combo="enter" label="Load Example" onKeyDown={this._loadUrl} />
        </Hotkeys>
      );
    }
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
        <Hotkey global combo="shift + meta + x" label="Clear All" onKeyDown={this._reload} />
        <Hotkey global combo="alt + d" label="Debug Mode" onKeyDown={this._toggleDebug} />
        <Hotkey global combo="j" label="Next Node" onKeyDown={this._nextNode} />
        <Hotkey global combo="k" label="Prev Node" onKeyDown={this._prevNode} />
      </Hotkeys>
    );
  }
}

const styles = {
  toolSection: { flex: 1, display: 'flex' },
  leftAlign: { justifyContent: 'flex-start' },
  rightAlign: { justifyContent: 'flex-end' },
};

setHotkeysDialogProps({ className: 'bp3-dark', globalHotkeysGroup: 'Menu' });
const AppWithHK = HotkeysTarget(App);

document.addEventListener('DOMContentLoaded', () => {
  // $FlowIgnore
  ReactDOM.render(<AppWithHK className="bp3-dark" />, document.getElementById('eternal-root'));
});

export default AppWithHK;
