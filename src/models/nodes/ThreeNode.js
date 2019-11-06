// @flow
import React from 'react';
import { get } from 'lodash';
import Base from 'threeUtil/Base';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import {
  AmbientLight,
  DirectionalLight,
  LoadingManager,
  Mesh,
  NearestFilter,
  Object3D,
  TextureLoader,
  Vector2,
  Vector3,
  Scene,
  Color as ThreeColor,
  PerspectiveCamera,
  OrthographicCamera,
} from 'three';
import {
  ChromaticAberrationEffect,
  ColorAverageEffect,
  DotScreenEffect,
  Effect,
  EffectPass,
  GlitchEffect,
  NoiseEffect,
  Pass,
  ScanlineEffect,
  VignetteEffect,
} from 'postprocessing';
import { arrayOf } from 'utils/typeUtils';
const Types = window.Types;
const URL_BASE = process.env.PUBLIC_URL || '';

type P = { child: Mesh };
type S = { base: Base, added: string[] };
const TT = {
  Color: Types.object.aliased('RGBColor', 'RGB representation of a color'),
  Light: Types.object.aliased('Light', 'A light source in a scene'),
  Camera: Types.object.aliased('Camera', 'A camera that exists in a scene'),
  Scene: Types.object.aliased('Scene', 'A 3D Scene'),
  PostEffect: Types.object.aliased('PostEffect', 'A post production render effect'),
  SceneElement: Types.object.aliased(
    'SceneElement',
    'Anything that can be added to a scene, including Meshes, Lights, & Cameras'
  ),
};

export default class ThreeNode extends NodeBase<
  S,
  P,
  { camera: PerspectiveCamera | OrthographicCamera, scene: Scene }
> {
  static +displayName = 'Render Scene';
  static +registryName = 'ThreeNode';
  static description = (
    <span>This node renders a WebGL scene, by default with a perspective camera</span>
  );
  rendered: any;
  started: boolean = false;

  static schema = {
    input: {
      child: TT.SceneElement.desc('Any scene element[s] to be added'),
      fx: arrayOf(TT.PostEffect).desc('Post render pass(es)'),
      clearColor: TT.Color.desc("The renderer's clear color"),
      clearAlpha: Types.number.desc("The alpha component for the renderer's clear color"),
    },
    output: {
      camera: TT.Camera.desc("The scene's camera"),
      scene: TT.Scene.desc('The scene'),
    },
    state: {},
  };

  onAddToGraph = () => {
    this.state.base = new Base();
    this.state.added = [];
  };

  _start = () => {
    if (this.props.child && !this.started) {
      this.started = true;
      this.state.base.camera.position.set(0, 7, 30);
      this.state.base.camera.lookAt(new Vector3(0, 0, 0));
      this.state.base.start();
      if (this.state.base.renderPass && this.state.base.renderPass.renderToScreen) {
        this.rendered = this.state.base.renderPass;
      }
    }
  };

  willBeRemoved = () => {
    this.state.base.reset();
    this.state.base.cleanup();
  };

  addPass = (pass: Pass) => {
    const composer = this.state.base.composer;
    if (this.rendered && composer) {
      this.rendered.renderToScreen = false;
      composer.addPass(pass);
      pass.renderToScreen = true;
      this.rendered = pass;
    }
  };

  removePass = (pass: Pass) => {
    const composer = this.state.base.composer;
    if (composer) {
      composer.removePass(pass);
      pass.renderToScreen = false;
      pass.dispose();
    }
  };

  beforeDisconnectIn = (edge: Edge) => {
    const { toPort } = edge;
    if (toPort === 'child') {
      if (this.state.added.includes(edge.from.id)) {
        this.state.added = this.state.added.filter(id => id !== edge.from.id);
        Object.values(edge.from.outputCache).forEach(child => {
          if (child instanceof Object3D) {
            this.state.base.scene.remove(child);
          }
        });
      }
    }
  };

  onInputChange = (edge: Edge, change: $Shape<P>) => {
    const { toPort } = edge;
    if (toPort === 'child') {
      if (!this.state.added.includes(edge.from.id)) {
        this.state.added.push(edge.from.id);
        const child = edge.inDataFor(change);
        if (child instanceof Object3D) {
          this.state.base.scene.add(child);
        }
      }
    }
    if (toPort === 'clearColor') {
      const newColor = edge.inDataFor(change);
      const renderer = get(this.state, 'base.renderer');
      if (renderer && renderer.getClearColor() !== newColor) {
        renderer.setClearColor(newColor);
        this.state.base.scene.background = new ThreeColor(newColor);
      }
    }
    if (toPort === 'clearAlpha') {
      const newAlpha = edge.inDataFor(change);
      const renderer = get(this.state, 'base.renderer');
      if (renderer && renderer.getClearAlpha() !== newAlpha) {
        renderer.setClearAlpha(newAlpha);
      }
    }
    this._start();
    return [];
  };

  process = () => ({ camera: this.state.base.camera, scene: this.state.base.scene });
}

export class AmbientLightNode extends NodeBase<
  { light: AmbientLight },
  {},
  { light: AmbientLight }
> {
  static +displayName = 'Ambient Light';
  static +registryName = 'AmbientLightNode';
  static description = <span>An ambient light, intended to be added to a scene</span>;
  static schema = {
    input: { color: TT.Color.desc('The color of this ambient light') },
    output: { light: TT.Light.desc('The ambient light source') },
    state: { light: TT.Light.desc('The ambient light source') },
  };

  onAddToGraph = () => {
    this.state.light = new AmbientLight(0x313a59);
  };

  process = () => ({ light: this.state.light });

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    ['color'].forEach(k => {
      if (!prevProps || newProps[k] !== prevProps[k]) {
        this.pushToState('light', { [k]: newProps[k] }, [], k);
      }
    });
  };

  onInputChange = (edge: Edge, change: Object) => {
    return this.outKeys();
  };
}

export class DirectionalLightNode extends NodeBase<
  { light: DirectionalLight },
  {},
  { light: DirectionalLight }
> {
  static +displayName = 'Directional Light';
  static +registryName = 'DirectionalLightNode';
  static description = <span>A focused light, intended to be added to a scene</span>;
  static schema = {
    input: { color: TT.Color.desc('The color of this directional light') },
    output: { light: TT.Light.desc('The directional light source') },
    state: { light: TT.Light.desc('The directional light source, directed at the scene') },
  };

  willBecomeLive = () => {};
  onAddToGraph = () => {
    this.state.light = new DirectionalLight(0xffbbaa);
    this.state.light.position.set(0, -1, 0);
  };

  afterConnectOut = (edge: Edge) => {
    if (edge.to instanceof ThreeNode) {
      this.state.light.target.position.copy(edge.to.state.base.scene.position);
    }
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    ['color'].forEach(k => {
      if (!prevProps || newProps[k] !== prevProps[k]) {
        this.pushToState('light', { [k]: newProps[k] }, [], k);
      }
    });
  };
  process = () => ({ light: this.state.light });

  onInputChange = (edge: Edge, change: Object) => {
    return this.outKeys();
  };
}
type ColorT = { r: number, g: number, b: number };

export class Color extends NodeBase<{}, ColorT, { rgb: ColorT, hex: number }> {
  static +displayName = 'Color';
  static +registryName = 'Color';
  static defaultProps = { r: 0, g: 0, b: 0 };
  static description = <span>A color representation</span>;
  static schema = {
    input: {
      r: Types.number.desc('red channel, [0,255]'),
      g: Types.number.desc('green channel, [0,255]'),
      b: Types.number.desc('blue channel, [0,255]'),
    },
    output: {
      hex: Types.number.desc('hex representation of this color'),
      rgb: TT.Color.desc('rgb representation'),
    },
    state: {},
  };

  process = () => {
    const r = this.props.r || 0;
    const g = this.props.g || 0;
    const b = this.props.b || 0;
    let hex = Base.rgbToHex(r, g, b);
    return { hex: hex, rgb: { r, g, b } };
  };

  onInputChange = (edge: Edge, change: Object) => {
    return this.outKeys();
  };
}

export class GlitchPassNode extends NodeBase<{}, {}, { glitch: Object }> {
  static +displayName = 'Glitch Pass';
  static +registryName = 'GlitchPassNode';
  static description = <span>A holy perturbation</span>;

  static schema = {
    input: {
      delay: Types.Vec2.desc(
        'the min and max delay between glitches, as a 2d vector in second units'
      ),
    },
    output: { glitch: TT.PostEffect.desc('glitchy pass that can be applied to a render') },
    state: {},
  };
  assets: Map<string, any>;
  glitch: GlitchEffect;
  aberration: ChromaticAberrationEffect;
  rendered: boolean = false;
  passes: EffectPass[] = [];

  load = (callback: () => void) => {
    const assets = new Map();
    const loadingManager = new LoadingManager();
    const textureLoader = new TextureLoader(loadingManager);
    loadingManager.onProgress = (item, loaded, total) => {
      if (loaded === total) {
        this.assets = assets;
        callback();
      }
    };
    textureLoader.load(URL_BASE + '/latent/textures/perturb.jpg', texture => {
      texture.magFilter = texture.minFilter = NearestFilter;
      assets.set('perturb-map', texture);
    });
  };

  _render = () => {
    if (this.rendered || !this.glitch || !this.assets) {
      return;
    }

    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        const camera = threeN.state.base.camera;
        if (camera) {
          const glitchPass = new EffectPass(camera, this.glitch);
          const chromaticAberrationPass = new EffectPass(camera, this.aberration);
          threeN.addPass(glitchPass);
          threeN.addPass(chromaticAberrationPass);
          this.passes = [chromaticAberrationPass, glitchPass];
          this.rendered = true;
        }
      }
    });
  };

  beforeDisconnectOut = () => {
    this.rendered = false;
    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        this.passes.forEach(pass => {
          pass.enabled = false;
          threeN.removePass(pass);
        });
      }
    });
  };

  willBecomeLive = () => {};

  onAddToGraph = () => {
    this.load(() => {
      this.aberration = new ChromaticAberrationEffect();
      this.glitch = new GlitchEffect({
        perturbationMap: this.assets.get('perturb-map'),
        chromaticAberrationOffset: this.aberration.offset,
      });
      this.glitch.delay = new Vector2(5.5, 10);
      this._render();
    });
  };

  afterConnectOut = (edge: Edge) => {
    this._render();
  };

  process = () => ({ glitch: this.glitch });

  onInputChange = (edge: Edge, change: Object) => {
    this.outputs.length && this._render();
    if ('delay' === edge.toPort) {
      this.glitch.delay = edge.inDataFor(change);
    }
    return this.outKeys();
  };
}

export class VignettePassNode extends NodeBase<
  { opacity: number, offset: number, darkness: number },
  {},
  { pass: Object, effect: Effect }
> {
  static +displayName = 'Vignette Pass';
  static +registryName = 'VignettePassNode';
  static description = <span>A Vignette post-process effect</span>;

  static schema = {
    input: {
      opacity: Types.number.desc('The vignette opacity [0,1]'),
      offset: Types.number.desc('The vignette offset [0,1]'),
      darkness: Types.number.desc('The vignette darkness [0,1]'),
    },
    output: {
      pass: TT.PostEffect.desc('a vignette pass that can be applied to a render'),
      effect: Types.object.desc('the effect info'),
    },
    state: {},
  };

  static shortNames = { effect: 'fx' };

  effect: Effect;
  pass: Pass;
  rendered: boolean = false;

  _render = () => {
    if (this.rendered) {
      return;
    }

    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        const camera = threeN.state.base.camera;
        if (camera) {
          this.effect = new VignetteEffect({
            eskil: false,
            offset: 0.25,
            darkness: 0.55,
          });
          this.pass = new EffectPass(camera, this.effect);
          threeN.addPass(this.pass);
          this.rendered = true;
        }
      }
    });
  };

  beforeDisconnectOut = () => {
    this.rendered = false;
    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        threeN.removePass(this.pass);
      }
    });
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    const effect = this.effect;
    if (!effect) return;
    ['darkness', 'offset'].forEach(k => {
      const uni = effect.uniforms.get(k);
      const newVal = newProps[k];
      if (uni !== undefined && typeof newVal === 'number' && prevProps[k] !== newVal) {
        uni.value = newVal;
      }
    });
    ['opacity'].forEach(k => {
      const opacity = get(effect, 'blendMode.opacity');
      const newVal = newProps[k];
      if (opacity !== undefined && typeof newVal === 'number' && opacity.value !== newVal) {
        opacity.value = newVal;
      }
    });
  };

  onAddToGraph = () => {
    this._render();
  };

  afterConnectOut = (edge: Edge) => {
    this._render();
  };

  process = () => ({ pass: this.pass, effect: this.effect });

  onInputChange = (edge: Edge, change: Object) => {
    this.outputs.length && this._render();
    return this.outKeys();
  };
}

export class ScanlinePassNode extends NodeBase<{}, {}, { pass: Object, effect: Effect }> {
  static +displayName = 'Scanline Pass';
  static +registryName = 'ScanlinePassNode';
  static description = <span>A scanline post-process effect</span>;

  static schema = {
    input: {},
    output: {
      pass: TT.PostEffect.desc('a scanline pass that can be applied to a render'),
      effect: Types.object.desc('the effect info'),
    },
    state: {},
  };

  static shortNames = { effect: 'fx' };

  effect: Effect;
  pass: Pass;
  rendered: boolean = false;

  _render = () => {
    if (this.rendered) {
      return;
    }

    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        const camera = threeN.state.base.camera;
        if (camera) {
          this.effect = new ScanlineEffect({ density: 1.5 });
          this.pass = new EffectPass(camera, this.effect);
          threeN.addPass(this.pass);
          this.rendered = true;
        }
      }
    });
  };

  willBecomeLive = () => {};

  beforeDisconnectOut = () => {
    this.rendered = false;
    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        threeN.removePass(this.pass);
      }
    });
  };

  onAddToGraph = () => {
    this._render();
  };

  afterConnectOut = (edge: Edge) => {
    this._render();
  };

  process = () => ({ pass: this.pass, effect: this.effect });

  onInputChange = (edge: Edge, change: Object) => {
    this.outputs.length && this._render();
    return this.outKeys();
  };
}

export class DotScreenPassNode extends NodeBase<{}, {}, { pass: Object, effect: Effect }> {
  static +displayName = 'DotScreen Pass';
  static +registryName = 'DotScreenPassNode';
  static description = <span>A Dot-screen post-process effect</span>;

  static schema = {
    input: {},
    output: {
      pass: TT.PostEffect.desc('a dotscreen pass that can be applied to a render'),
      effect: Types.object.desc('the effect info'),
    },
    state: {},
  };
  static shortNames = { effect: 'fx' };
  effect: Effect;
  pass: Pass;
  rendered: boolean = false;

  _render = () => {
    if (this.rendered) {
      return;
    }

    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        const camera = threeN.state.base.camera;
        if (camera) {
          const colorAverageEffect = new ColorAverageEffect();
          this.effect = new DotScreenEffect({
            blendFunction: 13,
            scale: 1.0,
            angle: Math.PI * 0.58,
          });
          this.effect.blendMode.opacity.value = 0.21;
          this.pass = new EffectPass(camera, this.effect, colorAverageEffect);
          threeN.addPass(this.pass);
          this.rendered = true;
        }
      }
    });
  };

  willBecomeLive = () => {};

  beforeDisconnectOut = () => {
    this.rendered = false;
    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        threeN.removePass(this.pass);
      }
    });
  };

  onAddToGraph = () => {
    this._render();
  };

  afterConnectOut = (edge: Edge) => {
    this._render();
  };

  process = () => ({ pass: this.pass, effect: this.effect });

  onInputChange = (edge: Edge, change: Object) => {
    this.outputs.length && this._render();
    return this.outKeys();
  };
}

export class NoisePassNode extends NodeBase<
  {},
  { opacity: number },
  { pass: Object, effect: Effect }
> {
  static +displayName = 'Noise Pass';
  static +registryName = 'NoisePassNode';
  static description = <span>A noise post-process effect</span>;

  static schema = {
    input: {
      opacity: Types.number.desc('the blending opacity'),
    },
    output: {
      pass: TT.PostEffect.desc('a noise pass that can be applied to a render'),
      effect: Types.object.desc('the effect info'),
    },
    state: {},
  };
  static shortNames = { effect: 'fx' };
  effect: Effect;
  pass: Pass;
  rendered: boolean = false;

  _render = () => {
    if (this.rendered) {
      return;
    }
    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        const camera = threeN.state.base.camera;
        if (camera) {
          this.effect = new NoiseEffect({});
          this.pass = new EffectPass(camera, this.effect);
          this.effect.blendMode.opacity.value = get(this, 'props.opacity', 0.21);
          threeN.addPass(this.pass);
          this.rendered = true;
        }
      }
    });
  };

  willReceiveProps = (newProps: Object) => {
    const effect = this.effect;
    if (!effect) return;
    ['opacity'].forEach(k => {
      const opacity = get(effect, 'blendMode.opacity');
      const newVal = newProps[k];
      if (opacity !== undefined && typeof newVal === 'number' && opacity.value !== newVal) {
        opacity.value = newVal;
      }
    });
  };

  willBecomeLive = () => {};

  onAddToGraph = () => {
    this._render();
  };

  beforeDisconnectOut = () => {
    this.rendered = false;
    this.outputs.forEach(edge => {
      if (edge.to instanceof ThreeNode) {
        const threeN: ThreeNode = edge.to;
        threeN.removePass(this.pass);
      }
    });
  };

  afterConnectOut = (edge: Edge) => {
    this._render();
  };

  process = () => ({ pass: this.pass, effect: this.effect });

  onInputChange = (edge: Edge, change: Object) => {
    this.outputs.length && this._render();
    return this.outKeys();
  };
}
