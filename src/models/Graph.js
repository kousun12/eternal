//@flow
import { get, flatten, uniqBy } from 'lodash';
import Edge from 'models/Edge';
import NodeBase from 'models/NodeBase';
import type { NodeInSpace, Pos } from 'types';
import type { AnyNode, NodeSerialization } from 'models/NodeBase';
import type { EdgeSerialization } from 'models/Edge';
import { uuid } from 'helpers';

export type GraphSerialization = {
  name?: string,
  nodes: NodeSerialization<any>[],
  edges: EdgeSerialization[],
};

export default class Graph {
  id: string;
  name: string = 'untitled';
  nodes: NodeInSpace[] = [];
  edges: Edge[] = [];

  constructor(nodes?: NodeInSpace[] = [], edges?: Edge[] = [], name?: string = 'untitled') {
    this.id = uuid();
    const _nodes = nodes || [];
    _nodes.forEach(nis => this.addNode(nis.node, nis.pos));
    const _edges = edges || [];
    _edges.forEach(this.addEdge);
    this.name = name;
  }

  nodeWithId: string => ?NodeInSpace = id => this.nodes.find(n => n.node.id === id);

  nodeWithIdF: string => NodeInSpace = id => {
    const n = this.nodeWithId(id);
    if (n) {
      return n;
    } else {
      throw Error('not found');
    }
  };

  addNode: (AnyNode, Pos) => NodeInSpace = (node, pos) => {
    const nis = { node, pos };
    this.nodes.push(nis);
    node.onAddToGraph();
    return nis;
  };

  removeNode: AnyNode => Graph = node => {
    node.inputs.forEach(this.removeEdge);
    node.outputs.forEach(this.removeEdge);
    node.willBeRemoved();
    this.nodes = this.nodes.filter(n => n.node.id !== node.id);
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

  serialize: string => GraphSerialization = name => {
    return {
      name,
      nodes: this.nodes.map(n => n.node.serialize(n.pos.x, n.pos.y)),
      edges: this.edges.map(e => e.serialize()),
    };
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

  dispose = () => {
    this.edges.forEach(this.removeEdge);
    this.nodes.map(n => n.node).forEach(this.removeNode);
    this.edges = [];
    this.nodes = [];
    if (get(window, '$graph.id') === this.id) {
      window['$graph'] = null;
    }
  };

  static load(json: GraphSerialization): Graph {
    const nodesInSpace = json.nodes.map(n => ({ node: NodeBase.load(n), pos: { x: n.x, y: n.y } }));
    const nodes = nodesInSpace.map(nis => nis.node);
    const edges = json.edges.map(j => Edge.load(j, nodes));
    const name = json.name || 'untitled';
    return new Graph(nodesInSpace, edges, name);
  }

  static empty(): GraphSerialization {
    return { name: 'untitled', edges: [], nodes: [] };
  }
}
