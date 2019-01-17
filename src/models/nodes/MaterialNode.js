// @flow
import React from 'react';
import { get } from 'lodash';
import NodeBase from 'models/NodeBase';
import { DoubleSide, Material, MeshLambertMaterial, ShaderMaterial } from 'three';
import Base, { uniforms } from 'threeUtil/Base';
const Types = window.Types;

type P = {};
type S = { material: Material };
type O = { material: Material };

let color = Base.rgbToHex(28, 5, 9);

export class LambertMaterialNode extends NodeBase<S, P, O> {
  static +displayName = 'Lambert Material';
  static +registryName = 'LambertMaterialNode';
  static description = (
    <div>
      <p>A material for non-shiny surfaces, without specular highlights.</p>
      <p>
        The material uses a non-physically based Lambertian model for calculating reflectance. This
        can simulate some surfaces (such as untreated wood or stone) well, but cannot simulate shiny
        surfaces with specular highlights (such as varnished wood).
      </p>
      <p>
        Shading is calculated using a Gouraud shading model. This calculates shading per vertex
        (i.e. in the vertex shader) and interpolates the results over the polygon's faces.
      </p>
    </div>
  );

  static schema = {
    input: {},
    output: { material: Types.object },
    state: { material: Types.object },
  };

  onAddToGraph = () => {
    this.state.material = new MeshLambertMaterial({
      transparent: false,
      color: color,
      wireframe: false,
    });
  };

  process = () => {
    return this.state;
  };
}

export class ShaderMaterialNode extends NodeBase<S, { vertex: string, fragment: string }, O> {
  static +displayName = 'Shader Material';
  static +registryName = 'ShaderMaterialNode';
  static defaultProps = {
    vertex: `void main() {\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}`,
    fragment: 'void main() {\n\tgl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}',
  };
  static description = (
    <div>
      <p>
        A material rendered with custom shaders. A shader is a small program written in GLSL that
        runs on the GPU.
      </p>
      <p>
        You can use the directive #pragma unroll_loop in order to unroll a for loop in GLSL by the
        shader preprocessor. The directive has to be placed right above the loop. The loop should be
        formatted with the standard spec (normalized, var i, paren spacing)
      </p>
      <p>
        Additionally, all shader materials will be subscribed to global uniforms: `u_mouse` (vec2),
        `u_time` (float), and `u_resolution` (vec2)
      </p>
    </div>
  );

  static schema = {
    input: {
      vertex: Types.string.desc('Vertex shader for this shader material'),
      fragment: Types.string.desc('Fragment shader for this shader material'),
      transparent: Types.boolean.desc(
        'Whether or not this material responds to an alpha component'
      ),
    },
    output: { material: Types.object },
    state: { material: Types.object },
  };

  _setMaterial = () => {
    this.state.material = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: get(this.props, 'vertex'),
      fragmentShader: get(this.props, 'fragment'),
      transparent: true,
    });
  };

  onAddToGraph = () => {
    this._setMaterial();
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    ['vertex', 'fragment'].forEach(k => {
      if (!prevProps || newProps[k] !== prevProps[k]) {
        this.state.material[`${k}Shader`] = newProps[k];
        this.state.material.needsUpdate = true;
      }
    });
    ['transparent'].forEach(k => {
      if (!prevProps || newProps[k] !== prevProps[k]) {
        this.state.material[k] = newProps[k];
        this.state.material.needsUpdate = true;
      }
    });
  };

  process = () => {
    return this.state;
  };
}
