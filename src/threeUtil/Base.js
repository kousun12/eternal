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
import OrbitControls from 'orbit-controls-es6';
import Stats from 'threeUtil/Stats';
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

  update: (delta: number) => ?UpdateSignal = delta => {};

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
    new OrbitControls(this.camera, renderer.domElement);
    renderer.domElement.style.visibility = 'hidden';
    if (document.body) {
      document.body.appendChild(WEBVR.createButton(renderer));
      // document.body.appendChild(renderer.domElement);
    }
    renderer.vr.enabled = true;
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
    // let animationId;
    const render = () => {
      const delta = clock.getDelta();
      if (this.update(delta) !== Base.Signals.STOP) {
        // animationId = requestAnimationFrame(render);
        uniforms.u_time.value += delta;
        if (renderer instanceof EffectComposer) {
          renderer.render(delta);
        } else {
          renderer.render(this.scene, this.camera);
        }
      } else {
        renderer.setAnimationLoop(null);
        // cancelAnimationFrame(animationId);
      }
      if (this.stats) {
        this.stats.update();
      }
    };
    renderer.renderer.setAnimationLoop(render);
    // render();
  };

  _listenForWindowChanges = () => {
    window.addEventListener('resize', this.resize);
  };

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

var WEBVR = {
  createButton: function(renderer, options) {
    if (options && options.frameOfReferenceType) {
      renderer.vr.setFrameOfReferenceType(options.frameOfReferenceType);
    }

    function showEnterVR(device) {
      button.style.display = '';

      button.style.cursor = 'pointer';
      button.style.left = 'calc(50% - 50px)';
      button.style.width = '100px';

      button.textContent = 'ENTER VR';

      button.onmouseenter = function() {
        button.style.opacity = '1.0';
      };
      button.onmouseleave = function() {
        button.style.opacity = '0.5';
      };

      button.onclick = function() {
        device.isPresenting
          ? device.exitPresent()
          : device.requestPresent([{ source: renderer.domElement }]);
      };

      renderer.vr.setDevice(device);
    }

    function showEnterXR(device) {
      var currentSession = null;

      function onSessionStarted(session) {
        session.addEventListener('end', onSessionEnded);

        renderer.vr.setSession(session);
        button.textContent = 'EXIT VR';

        currentSession = session;
      }

      function onSessionEnded(event) {
        currentSession.removeEventListener('end', onSessionEnded);

        renderer.vr.setSession(null);
        button.textContent = 'ENTER VR';

        currentSession = null;
      }

      //

      button.style.display = '';

      button.style.cursor = 'pointer';
      button.style.left = 'calc(50% - 50px)';
      button.style.width = '100px';

      button.textContent = 'ENTER VR';

      button.onmouseenter = function() {
        button.style.opacity = '1.0';
      };
      button.onmouseleave = function() {
        button.style.opacity = '0.5';
      };

      button.onclick = function() {
        if (currentSession === null) {
          device
            .requestSession({ immersive: true, exclusive: true /* DEPRECATED */ })
            .then(onSessionStarted);
        } else {
          currentSession.end();
        }
      };

      renderer.vr.setDevice(device);
    }

    function showVRNotFound() {
      button.style.display = '';

      button.style.cursor = 'auto';
      button.style.left = 'calc(50% - 75px)';
      button.style.width = '150px';

      button.textContent = 'VR NOT FOUND';

      button.onmouseenter = null;
      button.onmouseleave = null;

      button.onclick = null;

      renderer.vr.setDevice(null);
    }

    function stylizeElement(element) {
      element.style.position = 'absolute';
      element.style.bottom = '20px';
      element.style.padding = '12px 6px';
      element.style.border = '1px solid #fff';
      element.style.borderRadius = '4px';
      element.style.background = 'rgba(0,0,0,0.1)';
      element.style.color = '#fff';
      element.style.font = 'normal 13px sans-serif';
      element.style.textAlign = 'center';
      element.style.opacity = '0.5';
      element.style.outline = 'none';
      element.style.zIndex = '999';
    }

    if ('xr' in navigator) {
      var button = document.createElement('button');
      button.style.display = 'none';

      stylizeElement(button);

      navigator.xr
        .requestDevice()
        .then(function(device) {
          device
            .supportsSession({ immersive: true, exclusive: true /* DEPRECATED */ })
            .then(function() {
              showEnterXR(device);
            })
            .catch(showVRNotFound);
        })
        .catch(showVRNotFound);

      return button;
    } else if ('getVRDisplays' in navigator) {
      var button = document.createElement('button');
      button.style.display = 'none';

      stylizeElement(button);

      window.addEventListener(
        'vrdisplayconnect',
        function(event) {
          showEnterVR(event.display);
        },
        false
      );

      window.addEventListener(
        'vrdisplaydisconnect',
        function(event) {
          showVRNotFound();
        },
        false
      );

      window.addEventListener(
        'vrdisplaypresentchange',
        function(event) {
          button.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR';
        },
        false
      );

      window.addEventListener(
        'vrdisplayactivate',
        function(event) {
          event.display.requestPresent([{ source: renderer.domElement }]);
        },
        false
      );

      navigator
        .getVRDisplays()
        .then(function(displays) {
          if (displays.length > 0) {
            showEnterVR(displays[0]);
          } else {
            showVRNotFound();
          }
        })
        .catch(showVRNotFound);

      return button;
    } else {
      var message = document.createElement('a');
      message.href = 'https://webvr.info';
      message.innerHTML = 'WEBVR NOT SUPPORTED';

      message.style.left = 'calc(50% - 90px)';
      message.style.width = '180px';
      message.style.textDecoration = 'none';

      stylizeElement(message);

      return message;
    }
  },

  // DEPRECATED

  checkAvailability: function() {
    console.warn('WEBVR.checkAvailability has been deprecated.');
    return new Promise(function() {});
  },

  getMessageContainer: function() {
    console.warn('WEBVR.getMessageContainer has been deprecated.');
    return document.createElement('div');
  },

  getButton: function() {
    console.warn('WEBVR.getButton has been deprecated.');
    return document.createElement('div');
  },

  getVRDisplay: function() {
    console.warn('WEBVR.getVRDisplay has been deprecated.');
  },
};
