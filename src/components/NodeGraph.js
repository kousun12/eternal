// @flow

import React from 'react';
import { get, uniqBy, throttle } from 'lodash';
import Node from './Node';
import Spline from './Spline';
import SVGComponent from './SVGComponent';
import type { NodeInSpace, Pos } from 'types';
import Graph from 'models/Graph';
import Edge from 'models/Edge';
import type { AnyNode } from 'models/NodeBase';

import { outOffset, inOffset } from './util';
import { DraggableData } from 'react-draggable';
import { Hotkey, Hotkeys, HotkeysTarget } from '@blueprintjs/core';
type P = {
  graph: Graph,
  paneId: ?string,
  onCreateEdge?: Edge => void,
  onDeleteEdge?: Edge => void,
  onNodeSelect?: AnyNode => void,
  onNodeDeselect?: (AnyNode, ?boolean) => void,
  onNodeSelectionChange?: (?AnyNode) => void,
  visible: boolean,
};

type S = {
  graph: Graph,
  source: ?[string, number],
  dragging: boolean,
  mousePos: ?Pos,
  highlighted: NodeInSpace[],
  moving: boolean,
};

type DragDirective = {
  nis: NodeInSpace,
  offset: Pos,
};

class NodeGraph extends React.Component<P, S> {
  dragDirectives: DragDirective[] = [];
  constructor(props: P) {
    super(props);
    this.state = {
      graph: props.graph,
      source: null,
      mousePos: null,
      dragging: false,
      highlighted: [],
      moving: false,
    };
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentWillUnmount() {
    this.onMouseMove.cancel();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  componentWillReceiveProps(nextProps: $ReadOnly<P>) {
    this.setState({ graph: nextProps.graph });
  }

  onMouseUp = () => {
    setTimeout(() => this.setState({ dragging: false }), 1);
  };

  onMouseMove = throttle((e: MouseEvent) => {
    const { dragging, highlighted, mousePos, moving } = this.state;
    const set = !mousePos || dragging || highlighted.length > 0;
    if (moving) {
      this.forceUpdate();
      return;
    }
    if (!set) return;
    e.stopPropagation();
    e.preventDefault();
    this.setState({ mousePos: { x: e.clientX, y: e.clientY } });
  }, 50);

  onNodeStartMove = (started: NodeInSpace, data: DraggableData) => {
    this.dragDirectives = this.state.highlighted.map(nis => ({
      nis,
      offset: { x: started.pos.x - nis.pos.x, y: started.pos.y - nis.pos.y },
    }));
    this.setState({ moving: true });
  };

  onNodeStopMove = (node: NodeInSpace, data: DraggableData) => {
    this.onNodeMove(node, data);
    this.setState({ moving: false });
  };

  onNodeMove = (node: NodeInSpace, data: DraggableData) => {
    if (this.dragDirectives.length > 1) {
      const ids = this.state.highlighted.map(nis => nis.node.id);
      this.dragDirectives.forEach(d => {
        if (ids.includes(d.nis.node.id)) {
          d.nis.pos = { x: data.x - d.offset.x, y: data.y - d.offset.y };
        }
      });
    }
  };

  onStartConnector = (id: string, outputIndex: number) => {
    const mousePos = get(window, 'event.clientX')
      ? { x: window.event.clientX, y: window.event.clientY }
      : this.state.mousePos;
    this.setState({ mousePos, dragging: true, source: [id, outputIndex] });
  };

  onCompleteConnector = (id: string, inIndex: number) => {
    const { dragging, source, graph } = this.state;
    if (dragging && source) {
      let fromNode = graph.nodeWithId(source[0]);
      let toNode = graph.nodeWithId(id);
      if (fromNode && toNode) {
        let fromAttr = fromNode.node.outKeyAt(source[1]);
        let toAttr = toNode.node.inKeyAt(inIndex);
        const edge = new Edge(fromNode.node, toNode.node, fromAttr, toAttr);
        graph.addEdge(edge);
        this.props.onCreateEdge && this.props.onCreateEdge(edge);
      }
    }
    this.setState({ dragging: false });
    this.forceUpdate();
  };

  handleRemoveConnector = (edge: Edge) => {
    if (this.props.onDeleteEdge) {
      this.props.onDeleteEdge(edge);
    }
    this.state.graph.removeEdge(edge);
    this.forceUpdate();
  };

  onNodeSelect = async (n: NodeInSpace) => {
    if (this.props.onNodeSelect) {
      this.props.onNodeSelect(n.node);
    }
    this._onNodeChange(n.node);
    const highlighted = uniqBy(this.state.highlighted.concat(n), 'node.id');
    await this.setState({ highlighted });
  };

  onNodeDeselect = (n: NodeInSpace, all?: boolean) => {
    if (this.props.onNodeDeselect) {
      this.props.onNodeDeselect(n.node);
    }
    const highlighted = all
      ? []
      : this.state.highlighted.filter(node => n.node.id !== node.node.id);
    this._onNodeChange(null);
    this.setState({ highlighted });
  };

  onDeleteNode = (n: AnyNode) => {
    this.state.graph.removeNode(n);
    this.forceUpdate();
  };

  _onNodeChange = (n: ?AnyNode) => {
    if (this.props.onNodeSelectionChange) {
      this.props.onNodeSelectionChange(n);
    }
  };

  resetSize = () => {
    const maxW = Math.max(...this.state.graph.nodes.map(nis => nis.pos.x));
    const maxH = Math.max(...this.state.graph.nodes.map(nis => nis.pos.y));
    const elem = document.getElementById('eternal-root');
    if (elem) {
      elem.style.width = String(maxW + 300);
      elem.style.height = String(maxH + 500);
    }
  };

  _drawEdges = () => {
    const {
      graph,
      graph: { edges },
      mousePos,
      dragging,
      source,
      highlighted,
    } = this.state;
    const { visible, paneId } = this.props;
    if (!visible) {
      return null;
    }
    let activeSpline = null;
    const nodeIds = highlighted.map(n => n.node.id);
    if (paneId) nodeIds.push(paneId);
    if (dragging && source) {
      let src = graph.nodeWithIdF(source[0]);
      activeSpline = <Spline start={outOffset(src.pos.x, src.pos.y, source[1])} end={mousePos} />;
    }
    return (
      <SVGComponent height="100%" width="100%" ref="svgComponent">
        {edges.map(e => {
          const frm = graph.nodeWithIdF(e.from.id);
          const to = graph.nodeWithIdF(e.to.id);
          const highlighted = nodeIds.find(id => id === e.from.id || id === e.to.id);
          return (
            <Spline
              highlighted={highlighted}
              edge={e}
              start={outOffset(frm.pos.x, frm.pos.y, frm.node.outKeys().indexOf(e.fromPort))}
              end={inOffset(to.pos.x, to.pos.y, to.node.inKeys().indexOf(e.toPort))}
              key={`${e.id}-spline`}
              onRemove={() => this.handleRemoveConnector(e)}
            />
          );
        })}
        {activeSpline}
      </SVGComponent>
    );
  };

  render() {
    const {
      graph: { nodes },
      dragging,
    } = this.state;
    const { visible } = this.props;
    const ids = this.state.highlighted.map(nis => nis.node.id);
    return (
      <div className={(dragging ? 'dragging' : '') + ' graph-root'}>
        {nodes.map((nis, i) => {
          return (
            <Node
              selected={ids.includes(nis.node.id)}
              visible={visible}
              pos={nis.pos}
              index={i}
              nis={nis}
              inView={nis.node.id === this.props.paneId}
              key={`node-${nis.node.id}`}
              onNodeStart={this.onNodeStartMove}
              onNodeStop={this.onNodeStopMove}
              onNodeMove={this.onNodeMove}
              onStartConnector={this.onStartConnector}
              onCompleteConnector={this.onCompleteConnector}
              onNodeSelect={this.onNodeSelect}
              onNodeDeselect={this.onNodeDeselect}
              onDelete={this.onDeleteNode}
            />
          );
        })}
        {this._drawEdges()}
      </div>
    );
  }

  _onCopy = () => {
    const highlighted = this.state.graph.duplicate(this.state.highlighted);
    this.setState({ highlighted });
  };

  _selectAll = () => {
    this.setState({ highlighted: this.state.graph.nodes });
  };

  // noinspection JSUnusedGlobalSymbols
  renderHotkeys() {
    const { highlighted } = this.state;
    const showCopy = highlighted && highlighted.length > 0;
    return (
      <Hotkeys>
        {showCopy && (
          <Hotkey
            group="Node Actions"
            combo="meta + c"
            label="Duplicate Node(s)"
            global={true}
            onKeyDown={this._onCopy}
          />
        )}
        <Hotkey global combo="shift + meta + a" label="Select All" onKeyDown={this._selectAll} />
      </Hotkeys>
    );
  }
}

export default HotkeysTarget(NodeGraph);
