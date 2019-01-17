// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import {
  TorusKnotBufferGeometry,
  Geometry,
  PlaneBufferGeometry,
  BoxBufferGeometry,
  SphereBufferGeometry,
} from 'three';
const Types = window.Types;

type P = {
  radius: number,
  tube: number,
  tubularSegments: number,
  radialSegments: number,
  p: number,
  q: number,
};
type S = { geometry: Geometry };
type O = { geometry: Geometry };

export class TorusKnotGeometryNode extends NodeBase<S, P, O> {
  static +displayName = 'Torus Knot Geometry';
  static +registryName = 'TorusKnotGeometryNode';
  static +defaultProps = {
    radius: 1,
    tube: 0.4,
    tubularSegments: 64,
    radialSegments: 8,
    p: 2,
    q: 3,
  };
  static description = (
    <span>
      A torus knot (buffer) geometry, with most attributes encoded in buffers so that they are more
      efficiently transported to your GPU.
    </span>
  );

  static schema = {
    input: {
      radius: Types.number.desc('The radius of this geometry'),
      tube: Types.number.desc('The tube radius'),
      tubularSegments: Types.number.desc('The number of tubular segments for this geometry'),
      radialSegments: Types.number.desc('The number of radial segments for this geometry'),
      p: Types.number.desc('The torus knot p'),
      q: Types.number.desc('The torus knot q'),
    },
    output: { geometry: Types.object.desc('this particular geometry') },
    state: { geometry: Types.object.desc('this particular geometry') },
  };

  _setGeo = () => {
    const { radius, tube, tubularSegments, radialSegments, p, q } = this.props;
    this.state.geometry && this.state.geometry.dispose();
    this.state.geometry = new TorusKnotBufferGeometry(
      radius,
      tube,
      tubularSegments,
      radialSegments,
      p,
      q
    );
  };

  onAddToGraph = () => {
    this._setGeo();
  };

  onInputChange = (edge: Edge) => {
    let notify = false;
    ['radius', 'tube', 'tubularSegments', 'radialSegments', 'p', 'q'].forEach(k => {
      if (k === edge.toPort && this.state.geometry.parameters[k] !== this.props[k]) {
        this._setGeo();
        notify = true;
      }
    });
    return notify ? this.outKeys() : [];
  };

  process = () => {
    return this.state;
  };
}

export class PlaneGeometryNode extends NodeBase<S, { width: number, height: number }, O> {
  static +displayName = 'Plane Geometry';
  static +registryName = 'PlaneGeometryNode';
  static +defaultProps = { width: 2, height: 2 };
  static description = (
    <span>
      A plane (buffer) geometry, with most attributes encoded in buffers so that they are more
      efficiently transported to your GPU.
    </span>
  );

  static schema = {
    input: {
      width: Types.number.desc('The width of this plane'),
      height: Types.number.desc('The height of this plane'),
    },
    output: { geometry: Types.object.desc('this particular geometry') },
    state: { geometry: Types.object.desc('this particular geometry') },
  };

  _setGeo = () => {
    const { width, height } = this.props;
    this.state.geometry && this.state.geometry.dispose();
    this.state.geometry = new PlaneBufferGeometry(width, height);
  };

  onAddToGraph = () => {
    this._setGeo();
  };

  onInputChange = (edge: Edge) => {
    let notify = false;
    ['width', 'height'].forEach(k => {
      if (k === edge.toPort && this.state.geometry.parameters[k] !== this.props[k]) {
        this._setGeo();
        notify = true;
      }
    });
    return notify ? this.outKeys() : [];
  };

  process = () => {
    return this.state;
  };
}

export class BoxGeometryNode extends NodeBase<
  S,
  {
    width: number,
    height: number,
    depth: number,
  },
  O
> {
  static +displayName = 'Box Geometry';
  static +registryName = 'BoxGeometryNode';
  static +defaultProps = {
    width: 1,
    height: 1,
    depth: 1,
  };
  static description = (
    <span>
      A box (buffer) geometry, with most attributes encoded in buffers so that they are more
      efficiently transported to your GPU.
    </span>
  );

  static schema = {
    input: {
      width: Types.number.desc('The width of this box'),
      height: Types.number.desc('The height of this box'),
      depth: Types.number.desc('The depth of this box'),
    },
    output: { geometry: Types.object.desc('this particular geometry') },
    state: { geometry: Types.object.desc('this particular geometry') },
  };

  _setGeo = () => {
    const { width, height, depth } = this.props;
    this.state.geometry && this.state.geometry.dispose();
    this.state.geometry = new BoxBufferGeometry(width, height, depth);
  };

  onAddToGraph = () => {
    this._setGeo();
  };

  onInputChange = (edge: Edge) => {
    let notify = false;
    ['width', 'height', 'depth'].forEach(k => {
      if (k === edge.toPort && this.state.geometry.parameters[k] !== this.props[k]) {
        this._setGeo();
        notify = true;
      }
    });
    return notify ? this.outKeys() : [];
  };

  process = () => {
    return this.state;
  };
}

export class SphereGeometryNode extends NodeBase<
  S,
  {
    radius: number,
    widthSegments: number,
    heightSegments: number,
  },
  O
> {
  static +displayName = 'Sphere Geometry';
  static +registryName = 'SphereGeometryNode';
  static +defaultProps = {
    radius: 1,
    widthSegments: 8,
    heightSegments: 6,
  };
  static description = (
    <span>
      A sphere (buffer) geometry, with most attributes encoded in buffers so that they are more
      efficiently transported to your GPU.
    </span>
  );

  static schema = {
    input: {
      radius: Types.number.desc('The radius of the sphere'),
      widthSegments: Types.number.desc('The number of segments along the geometry width'),
      heightSegments: Types.number.desc('The number of segments along the geometry height'),
    },
    output: { geometry: Types.object.desc('this particular geometry') },
    state: { geometry: Types.object.desc('this particular geometry') },
  };

  _setGeo = () => {
    const { radius, widthSegments, heightSegments } = this.props;
    this.state.geometry && this.state.geometry.dispose();
    this.state.geometry = new SphereBufferGeometry(radius, widthSegments, heightSegments);
  };

  onAddToGraph = () => {
    this._setGeo();
  };

  onInputChange = (edge: Edge) => {
    let notify = false;
    ['radius', 'widthSegments', 'heightSegments'].forEach(k => {
      if (k === edge.toPort && this.state.geometry.parameters[k] !== this.props[k]) {
        this._setGeo();
        notify = true;
      }
    });
    return notify ? this.outKeys() : [];
  };

  process = () => {
    return this.state;
  };
}
