// @flow
import React from 'react';
import { get } from 'lodash';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { Geometry, Material, Mesh, Points, Line } from 'three';
import type { Pos, Pos3 } from 'types';
const Types = window.Types;

const TT = {
  Geometry: Types.object.aliased(
    'Geometry',
    'An abstract geometry that describes verticies in space'
  ),
  Material: Types.object.aliased('Material', 'An abstract material, usually applied to geometries'),
  Mesh: Types.object.aliased('Mesh', 'A mesh that can be added to a scene and rendered'),
};

export default class MeshNode extends NodeBase<
  { mesh: Mesh },
  { geometry: Geometry, material: Material, rotation: Pos, scale: Pos3 },
  { mesh: Mesh }
> {
  static +displayName = 'Mesh';
  static +registryName = 'MeshNode';
  static description = <span>A WebGL mesh</span>;

  static schema = {
    input: {
      geometry: TT.Geometry.desc('The geometry to use with this mesh'),
      material: TT.Material.desc("This mesh's material"),
      rotation: Types.Vec2.desc('The rotation of this mesh node, in radians'),
      scale: Types.Vec3.desc('The scale of this mesh node'),
    },
    output: { mesh: TT.Mesh.desc('The resulting Mesh') },
    state: { mesh: Types.object },
  };

  static shortNames = { material: 'mat', geometry: 'geo', rotation: 'rot' };

  willBecomeLive = () => {
    const { geometry, material } = this.props;
    this.state.mesh = new Mesh(geometry, material);
    this.notifyAllOutputs(true);
  };

  onAddToGraph = () => {
    this.state.mesh = new Mesh();
  };

  onInputChange = (edge: Edge, change: Object) => {
    if (edge.toPort === 'rotation') {
      const { rotation } = this.props;
      this.state.mesh.rotation.x = rotation.x;
      this.state.mesh.rotation.y = rotation.y;
    }
    if (edge.toPort === 'scale') {
      const { scale } = this.props;
      this.state.mesh.scale.x = scale.x;
      this.state.mesh.scale.y = scale.y;
      this.state.mesh.scale.z = scale.z;
    }
    if (edge.toPort === 'material') {
      const mat = edge.inDataFor(change);
      if (get(mat.id) !== get(this.state.mesh, 'material.id')) {
        this.state.mesh.material && this.state.mesh.material.dispose();
        this.state.mesh.material = mat;
      }
    }
    if (edge.toPort === 'geometry') {
      const geo = edge.inDataFor(change);
      if (get(geo.id) !== get(this.state.mesh, 'geometry.id')) {
        this.state.mesh.geometry && this.state.mesh.geometry.dispose();
        this.state.mesh.geometry = geo;
      }
    }
    return this.outKeys();
  };

  process = () => this.state;
}

// NB can't use class constructor name because we'll minify in prod
export const [LineNode, PointsNode] = [[Line, 'Line'], [Points, 'Points']].map(
  ([clazz, name]) =>
    class _MeshNode extends MeshNode {
      static +displayName = name;
      static +registryName = `${name}Node`;
      static description = <span>A WebGL {name}</span>;

      static schema = {
        ...super.schema,
        output: { mesh: TT.Mesh.desc(`The resulting ${name} object`) },
      };

      willBecomeLive = () => {
        const { geometry, material } = this.props;
        this.state.mesh = new clazz(geometry, material);
        this.notifyAllOutputs(true);
      };

      onAddToGraph = () => {
        this.state.mesh = new clazz();
      };
    }
);
