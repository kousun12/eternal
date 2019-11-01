// @flow
import React from 'react';
import { get } from 'lodash';
import NodeBase from 'models/NodeBase';
import {
  Material,
  MeshLambertMaterial,
  ShaderMaterial,
  AdditiveBlending,
  PointsMaterial,
  TextureLoader,
} from 'three';
import Base, { uniforms } from 'threeUtil/Base';
import Edge from 'models/Edge';
const Types = window.Types;

type P = { color: number };
type S = { material: Material };
type O = { material: Material };

const TT = {
  Color: Types.number.aliased('Color', 'Hex color'),
  Material: Types.object.aliased('Material', 'An abstract material, usually applied to geometries'),
  ShaderProgram: Types.string.aliased(
    'ShaderProgram',
    <div>
      <p>An OpenGL compatible GLSL shader</p>
    </div>
  ),
};

export class LambertMaterialNode extends NodeBase<S, P, O> {
  static +displayName = 'Lambert Material';
  static +registryName = 'LambertMaterialNode';
  static +defaultProps = { color: Base.rgbToHex(28, 5, 9) };
  static +description = (
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
    input: { color: TT.Color.desc('Color of this material') },
    output: { material: TT.Material.desc('The resulting material') },
    state: { material: TT.Material },
  };
  static shortNames = { material: 'mat' };

  onAddToGraph = () => {
    this.state.material = new MeshLambertMaterial({
      transparent: false,
      color: this.props.color,
      wireframe: false,
      size: 0.1,
    });
  };

  onInputChange = (edge: Edge, change: $Shape<P>) => {
    if (edge.toPort === 'color') {
      const data = edge.inDataFor(change);
      if (typeof data === 'object' && typeof data.r === 'number') {
        this.state.material.color.setRGB(data.r, data.g, data.b);
      } else {
        this.state.material.color.setHex(edge.inDataFor(change));
      }
    }
    return [];
  };

  process = () => this.state;
}

export class ParticleMaterialNode extends NodeBase<S, P, O> {
  static +displayName = 'Particle Material';
  static +registryName = 'ParticleMaterialNode';
  static +defaultProps = { color: Base.rgbToHex(28, 5, 9) };
  static description = (
    <div>
      <p>A material of particles</p>
    </div>
  );

  static schema = {
    input: { color: TT.Color.desc('Color of this material') },
    output: { material: TT.Material.desc('The resulting material') },
    state: { material: TT.Material },
  };
  static shortNames = { material: 'mat' };

  onAddToGraph = () => {
    this.state.material = new PointsMaterial({
      color: this.props.color,
      size: 0.2,
      transparent: true,
      blending: AdditiveBlending,
    });
  };

  onInputChange = (edge: Edge, change: $Shape<P>) => {
    if (edge.toPort === 'color') {
      const data = edge.inDataFor(change);
      if (typeof data === 'object' && typeof data.r === 'number') {
        this.state.material.color.setRGB(data.r, data.g, data.b);
      } else {
        this.state.material.color.setHex(edge.inDataFor(change));
      }
    }
    return [];
  };

  process = () => this.state;
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
      vertex: TT.ShaderProgram.desc('Vertex shader for this shader material'),
      fragment: TT.ShaderProgram.desc('Fragment shader for this shader material'),
      transparent: Types.boolean.desc(
        'Whether or not this material responds to an alpha component'
      ),
    },
    output: { material: TT.Material.desc('The resulting material') },
    state: { material: TT.Material },
  };
  static shortNames = { material: 'mat', transparent: 'transp' };

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

  process = () => this.state;
}

export class LoadTextureNode extends NodeBase<{}, { url: string, name: string }, {}> {
  static +displayName = 'Load Texture';
  static +registryName = 'LoadTextureNode';
  static description = <p>Load a texture into the global uniform set</p>;

  static schema = {
    input: {
      url: Types.string.desc('The url to fetch this texture at'),
      name: Types.string.desc('The name to export this sampler2D as'),
    },
    output: {},
    state: {},
  };
  _loaded = {};

  onInputChange = () => {
    const { url, name } = this.props;
    if (url && !this._loaded[url]) {
      const tl = new TextureLoader();
      this._loaded[url] = tl.load(url);
    }
    if (name && !uniforms[name] && this._loaded[url]) {
      uniforms[name] = { type: 't', value: this._loaded[url] };
    }
    return [];
  };
}
