//@flow
import { get, flatten, uniqBy, fromPairs, mapValues } from 'lodash';
import dagre from 'dagre';
import Edge from 'models/Edge';
import NodeBase from 'models/NodeBase';
import type { NodeInSpace, Pos } from 'types';
import type { AnyNode, NodeSerialization } from 'models/NodeBase';
import type { EdgeSerialization } from 'models/Edge';
import { uuid } from 'utils/string';
import type { PosMemo } from 'redux/ducks/graph';

type MetaData = { zoom?: number };

export type GraphSerialization = {
  name?: string,
  description?: string,
  nodes: NodeSerialization<any>[],
  edges: EdgeSerialization[],
  meta?: MetaData,
};

export default class Graph {
  id: string;
  name: string = 'untitled';
  description: string = '';
  meta: MetaData = {};
  nodes: NodeInSpace[] = [];
  _nodesById: { [string]: NodeInSpace } = {};
  edges: Edge[] = [];

  constructor(
    nodes?: NodeInSpace[] = [],
    edges?: Edge[] = [],
    name?: string = 'untitled',
    description?: string = '',
    meta: MetaData = {}
  ) {
    this.id = uuid();
    (nodes || []).forEach(nis => this.addNode(nis.node, nis.pos));
    (edges || []).forEach(this.addEdge);
    this.name = name;
    this.description = description || '';
    this.meta = meta;
  }

  nodeWithId: string => ?NodeInSpace = id => this._nodesById[id];

  nodeWithIdF: string => NodeInSpace = id => {
    const n = this.nodeWithId(id);
    if (!n) throw new Error('not found');
    return n;
  };

  addNode: (AnyNode, Pos) => NodeInSpace = (node, pos) => {
    const nis = { node, pos };
    this._nodesById[node.id] = nis;
    this.nodes.push(nis);
    node.onAddToGraph();
    return nis;
  };

  setNodes: (NodeInSpace[]) => Graph = nodes => {
    this.nodes = nodes;
    this._nodesById = fromPairs(nodes.map(n => [n.node.id, n]));
    return this;
  };

  updatePositions = (pos: PosMemo) => {
    this.nodes.forEach(nis => {
      const p = pos[nis.node.id];
      if (p) {
        nis.pos = p;
      }
    });
  };

  nodeIds = (): string[] => Object.keys(this._nodesById);

  nodePositions = (): PosMemo => mapValues(this._nodesById, 'pos');

  removeNode: AnyNode => Graph = node => {
    node.inputs.forEach(this.removeEdge);
    node.outputs.forEach(this.removeEdge);
    node.willBeRemoved();
    this.setNodes(this.nodes.filter(n => n.node.id !== node.id));
    return this;
  };

  addEdge: Edge => void = edge => {
    this.edges.push(edge);
    edge.from.addOutput(edge);
    edge.to.addInput(edge);
  };

  removeEdge: Edge => void = edge => {
    this.edges = this.edges.filter(e => e.id !== edge.id);
    edge.from.removeOutput(edge);
    edge.to.removeInput(edge);
  };

  serialize: (string, ?MetaData) => GraphSerialization = (name, meta) => {
    return {
      name,
      nodes: this.nodes.map(n => n.node.serialize(n.pos.x, n.pos.y)),
      edges: this.edges.map(e => e.serialize()),
      ...(meta && { meta }),
      description: this.description || '',
    };
  };

  setName = (name: string) => {
    this.name = name;
  };

  duplicate: (NodeInSpace[]) => NodeInSpace[] = nodes => {
    const ids = nodes.map(nis => nis.node.id);
    const newNodes = nodes.map(nis =>
      this.addNode(NodeBase.duplicate(nis.node), { x: nis.pos.x + 50, y: nis.pos.y + 50 })
    );
    uniqBy(flatten(nodes.map(nis => nis.node.inputs.concat(nis.node.outputs))), 'id').forEach(e => {
      const fIdx = ids.indexOf(e.from.id);
      const tIdx = ids.indexOf(e.to.id);
      if (fIdx !== -1 && tIdx !== -1) {
        this.addEdge(new Edge(newNodes[fIdx].node, newNodes[tIdx].node, e.fromPort, e.toPort));
      }
    });
    return newNodes;
  };

  layout = () => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({});
    g.setDefaultEdgeLabel(() => ({}));
    this.nodes.forEach(nis => {
      const dom = nis.node.domNode();
      g.setNode(nis.node.id, dom.getBoundingClientRect());
    });
    this.edges.forEach(edge => {
      g.setEdge(edge.from.id, edge.to.id);
    });
    g.nodes().forEach(function(v) {
      console.log('Node ' + v + ': ' + JSON.stringify(g.node(v)));
    });
    g.edges().forEach(function(e) {
      console.log('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
    });
  };

  dispose = () => {
    this.edges.forEach(this.removeEdge);
    this.nodes.map(n => n.node).forEach(this.removeNode);
    this.edges = [];
    this.nodes = [];
    this._nodesById = {};
    if (get(window, '$graph.id') === this.id) {
      window['$graph'] = null;
    }
  };

  static load(json: GraphSerialization): Graph {
    const nodesInSpace = json.nodes.map(n => ({ node: NodeBase.load(n), pos: { x: n.x, y: n.y } }));
    const nodes = nodesInSpace.map(nis => nis.node);
    const edges = json.edges.map(j => Edge.load(j, nodes));
    const name = json.name || 'untitled';
    const desc = json.description || '';
    const meta = json.meta || {};
    return new Graph(nodesInSpace, edges, name, desc, meta);
  }

  static empty(): GraphSerialization {
    return { name: 'untitled', edges: [], nodes: [] };
  }

  static serialization(frm: any): ?GraphSerialization {
    return typeof frm === 'object' && frm.edges && frm.nodes ? frm : null;
  }

  static fromFile(file: File, handler: GraphSerialization => void) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result;
      if (typeof result === 'string') {
        try {
          handler(JSON.parse(result));
        } catch (e) {
          console.error('could not load graph', e);
        }
      }
    };
    fileReader.readAsText(file);
  }
}
