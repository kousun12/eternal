// @flow
import React from 'react';
import { get } from 'lodash';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { Geometry, Material, Mesh } from 'three';
import type { Pos, Pos3 } from 'types';
const Types = window.Types;

type P = { geometry: Geometry, material: Material, rotation: Pos, scale: Pos3 };
type S = { mesh: Mesh };
type O = { mesh: Mesh };

const TT = {
  Geometry: Types.object.aliased(
    'Geometry',
    'An abstract geometry that describes verticies in space'
  ),
  Material: Types.object.aliased('Material', 'An abstract material, usually applied to geometries'),
  Mesh: Types.object.aliased('Mesh', 'A mesh that can be added to a scene and rendered'),
};

export default class MeshNode extends NodeBase<S, P, O> {
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

  process = () => {
    return this.state;
  };
}
