/* eslint-disable no-use-before-define */
// @flow
import {
  Clock,
  FogExp2,
  LoadingManager,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
  OrthographicCamera,
} from 'three';
import { throttle } from 'lodash';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import Stats from 'threeUtil/Stats';
import WEBVR from 'threeUtil/WebVR';
import { EffectComposer, RenderPass } from 'postprocessing';
// const THREE = require('three');
// window.THREE = THREE;

type Renderable = EffectComposer | WebGLRenderer;
export type UpdateSignal = $Keys<typeof Base.Signals>;
type ShaderUniform<T> = {
  type: string,
  value: T,
};

type GlobalUniforms = {
  u_resolution: ShaderUniform<Vector2>,
  u_mouse: ShaderUniform<Vector2>,
  u_time: ShaderUniform<number>,
};

export const uniforms: GlobalUniforms = {
  u_resolution: { type: 'v2', value: new Vector2() },
  u_mouse: { type: 'v2', value: new Vector2() },
  u_time: { type: 'f', value: 1.0 },
};

export default class Base {
  static Signals = { STOP: 'STOP' };
  loadingManager: LoadingManager;
  assets: ?Map<string, any>;
  scene: Scene;
  camera: PerspectiveCamera | OrthographicCamera;
  showStats: boolean = process.env.NODE_ENV === 'development';
  stats: ?{ domElement: Object, begin: () => void, update: () => void };
  renderer: ?Renderable;
  composer: ?EffectComposer;
  renderPass: ?RenderPass;

  constructor() {
    this.loadingManager = new LoadingManager();
    this.assets = null;
    this.scene = new Scene();
    // todo: eventually switch things to this
    // this.scene.background = new Color(0x2c2222);
    this.scene.fog = new FogExp2(0x0d0d0d, 0.0025);
    this.camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    if (this.showStats) {
      this.stats = new Stats();
    }

    // For the Three.js debugger chrome extension
    // window.scene = this.scene;
    // window.THREE = THREE;
  }

  setupStats() {
    if (this.stats) {
      this.stats.domElement.style.position = 'absolute';
      this.stats.domElement.style.left = '0px';
      this.stats.domElement.style.top = '0px';
      // $FlowIssue
      document.body.appendChild(this.stats.domElement);
      this.stats && this.stats.begin();
    }
  }

  load(callback: () => void) {
    callback();
  }

  afterLoad = () => {};

  orthoCam = () =>
    new OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      0.1,
      1000
    );

  initialise(composer?: ?EffectComposer, renderPass?: ?RenderPass) {
    this.setupStats();
    // NB: don't call this base impl if you want a higher level pass to be rendered
    if (renderPass) {
      renderPass.renderToScreen = true;
    }
  }

  update: (delta: number) => ?UpdateSignal = (delta) => {};

  configure(gui: ?Object) {}

  reset = () => {
    const fog = this.scene.fog;
    this.scene = new Scene();
    window.scene = this.scene;
    this.scene.fog = fog;
    const { renderer, composer } = this;
    if (renderer) {
      renderer.reset && renderer.reset();
      renderer.dispose();
    }
    if (composer) {
      composer.reset && composer.reset();
      composer.dispose && composer.dispose();
    }
    return this;
  };

  cleanup = () => {
    if (document.body && this.renderer) {
      document.body.removeChild(this.renderer.domElement);
    }
    window.removeEventListener('resize', this.resize);
  };

  // TODO Memoize
  static rgbToHex(r: number, g: number, b: number) {
    return (1 << 24) + (r << 16) + (g << 8) + b;
  }

  start = () => {
    const composer = new EffectComposer(this._makeRenderer(false), {
      stencilBuffer: true,
      depthTexture: true,
    });
    const renderer = composer.renderer;
    const controls = new OrbitControls(this.camera, renderer.domElement);
    renderer.domElement.style.visibility = 'hidden';
    document.body && document.body.appendChild(renderer.domElement);
    WEBVR.checkAvailability().then((avail) => {
      if (avail && document.body) {
        document.body.appendChild(WEBVR.createButton(renderer));
        renderer.vr.enabled = true;
      }
    });

    controls.update();
    composer.reset();
    this.load(() => {
      const renderPass = new RenderPass(this.scene, this.camera);
      this.renderPass = renderPass;
      composer.addPass(renderPass);
      this.initialise(composer, renderPass);
      uniforms.u_resolution.value.x = renderer.domElement.width;
      uniforms.u_resolution.value.y = renderer.domElement.height;
      renderer.setPixelRatio(renderer.domElement.devicePixelRatio);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      renderer.domElement.style.visibility = 'visible';
      this.afterLoad();
    });
    this._listenForWindowChanges();
    this._startRendering(composer);
    this.composer = composer;
    this.renderer = renderer;
  };

  // Optionally without a composer
  startRaw = () => {
    const renderer = this._makeRenderer();
    if (document.body) {
      document.body.appendChild(renderer.domElement);
    }
    new OrbitControls(this.camera, renderer.domElement);
    this.load(() => {
      this.initialise(null, null);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.afterLoad();
    });
    this._listenForWindowChanges();
    this._startRendering(renderer);
    this.renderer = renderer;
  };

  _startRendering = (renderer: Renderable) => {
    const clock = new Clock();
    const render = () => {
      const delta = clock.getDelta();
      if (this.update(delta) !== Base.Signals.STOP) {
        uniforms.u_time.value += delta;
        if (renderer instanceof EffectComposer) {
          renderer.render(delta);
        } else {
          renderer.render(this.scene, this.camera);
        }
      } else {
        renderer.setAnimationLoop(null);
      }
      if (this.stats) {
        this.stats.update();
      }
    };
    renderer.renderer.setAnimationLoop(render);
  };

  _listenForWindowChanges = () => window.addEventListener('resize', this.resize);

  resize = throttle((event: Event) => {
    // $FlowIssue
    const width = event.target.innerWidth;
    // $FlowIssue
    const height = event.target.innerHeight;
    if (this.composer) {
      this.composer.setSize(width, height);
    } else if (this.renderer) {
      this.renderer.setSize(width, height);
    }
    // $FlowIssue
    uniforms.u_resolution.value.x = this.renderer.domElement.width;
    // $FlowIssue
    uniforms.u_resolution.value.y = this.renderer.domElement.height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }, 18);

  _makeRenderer = (antialias: boolean = true) => {
    const r = new WebGLRenderer({ alpha: true, antialias });
    r.setSize(window.innerWidth, window.innerHeight);
    r.setPixelRatio(window.devicePixelRatio);
    r.setClearColor(0x2c2222);
    r.autoClear = false;
    return r;
  };
}
