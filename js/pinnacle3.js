(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("pinnacle3.coffee", function(exports, require, module) {
var Bar, Pinnacle3;

Bar = require('srcs/bar');

module.exports = Pinnacle3 = (function() {
  var _animation_frame_id_;

  _animation_frame_id_ = -1;

  function Pinnacle3(target, params) {
    this.target = target;
    this.params = params;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.bars = new Array;
    this.lights = new Array;
    this.radius = 300;
    this.paused = true;
    this.hue = (this.params.color && this.params.color.hue) || 0;
    this.range = (this.params.color && this.params.color.range) || 180;
    this.lightOffset = (this.params.color && this.params.color.lightOffset) || 10;
    this.initScene();
  }

  Pinnacle3.prototype.initScene = function() {
    var i, j, light;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setClearColor(0x1A1A1A, 1);
    this.renderer.autoClear = false;
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 10000);
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
    this.camera.position.x = 0;
    this.camera.position.y = Math.cos(Math.PI / 4) * this.radius;
    this.camera.position.z = Math.sin(Math.PI / 4) * this.radius;
    this.camera.lookAt(this.scene.position);
    this.renderer.setSize(this.width, this.height);
    this.target.appendChild(this.renderer.domElement);
    for (i = j = 1; j <= 99; i = j += 1) {
      this.bars.push(new Bar(this.scene, i, this.params));
    }
    light = new THREE.AmbientLight(0xFFFFFF);
    this.scene.add(light);
    this.setupParticles();
    this.setupComposer();
    if (this.params.mouse) {
      return this.initMouse();
    }
  };

  Pinnacle3.prototype.setupParticles = function() {
    var col, coords, i, j, loader, mat, particle;
    this.particles = new THREE.Geometry();
    loader = new THREE.TextureLoader();
    col = tinycolor('hsl(0, 100%, 50%)').toHsl();
    col.h = this.hue;
    mat = new THREE.PointsMaterial({
      color: new THREE.Color(tinycolor(col).toRgbString()),
      size: 8,
      map: loader.load('img/spark.png'),
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    mat.alphaTest = 0.1;
    for (i = j = 1; j <= 500; i = j += 1) {
      coords = {
        x: Math.random() * (this.radius * 2) - this.radius,
        y: Math.random() * (this.radius * 2) - this.radius,
        z: Math.random() * (this.radius * 2) - this.radius
      };
      particle = new THREE.Vector3(coords.x, coords.y, coords.z);
      particle.velocity = new THREE.Vector3(0, -Math.random(), 0);
      this.particles.vertices.push(particle);
    }
    this.particleSystem = new THREE.Points(this.particles, mat);
    return this.scene.add(this.particleSystem);
  };

  Pinnacle3.prototype.setupComposer = function() {
    var _this, effect;
    this.composer = new THREE.EffectComposer(this.renderer);
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
    if (!this.params.shaders || (this.params.shaders && this.params.shaders.shift)) {
      effect = new THREE.ShaderPass(THREE.RGBShiftShader);
      effect.uniforms['amount'].value = 0.0012;
      this.composer.addPass(effect);
    }
    if (!this.params.shaders || (this.params.shaders && this.params.shaders.bloom)) {
      effect = new THREE.BloomPass(.5, 25, 5, 512);
      this.composer.addPass(effect);
    }
    if (!this.params.shaders || (this.params.shaders && this.params.shaders.unreal)) {
      effect = new THREE.UnrealBloomPass(512, .3, 1.5, .95);
      this.composer.addPass(effect);
    }
    if (!this.params.shaders || (this.params.shaders && this.params.shaders.vignette)) {
      effect = new THREE.ShaderPass(THREE.VignetteShader);
      effect.uniforms["offset"].value = 1;
      effect.uniforms["darkness"].value = 1.2;
      this.composer.addPass(effect);
    }
    effect = new THREE.ShaderPass(THREE.CopyShader);
    effect.renderToScreen = true;
    this.composer.addPass(effect);
    _this = this;
    return window.addEventListener('resize', function() {
      _this.width = window.innerWidth;
      _this.height = window.innerHeight;
      _this.camera.aspect = _this.width / _this.height;
      _this.camera.updateProjectionMatrix();
      _this.renderer.setSize(_this.width, _this.height);
      return _this.composer.setSize(_this.width, _this.height);
    });
  };

  Pinnacle3.prototype.run = function(url) {
    this.audio = new Audio(url);
    this.audio.crossOrigin = "anonymous";
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.audioSrc = this.audioCtx.createMediaElementSource(this.audio);
    this.analyser = this.audioCtx.createAnalyser();
    this.audioSrc.connect(this.analyser);
    this.audioSrc.connect(this.audioCtx.destination);
    this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
    return this.play();
  };

  Pinnacle3.prototype.initMouse = function() {
    var _this;
    _this = this;
    return this.renderer.domElement.addEventListener('mousemove', function(e) {
      var angles, coords;
      angles = {
        theta: (Math.PI / 2) + ((e.clientX / _this.width) * (Math.PI / 8)) - (Math.PI / 16),
        phi: (Math.PI / 4) + ((e.clientY / _this.height) * (Math.PI / 8)) - (Math.PI / 16)
      };
      coords = {
        x: _this.radius * Math.sin(angles.phi) * Math.cos(angles.theta),
        y: _this.radius * Math.cos(angles.phi),
        z: _this.radius * Math.sin(angles.phi) * Math.sin(angles.theta)
      };
      _this.camera.position.x = coords.x;
      _this.camera.position.y = coords.y;
      _this.camera.position.z = coords.z;
      return _this.camera.lookAt(_this.scene.position);
    });
  };

  Pinnacle3.prototype.play = function() {
    this.audio.play();
    this.paused = false;
    this.target.classList.add('playing');
    return _animation_frame_id_ = requestAnimationFrame(this.animate.bind(this));
  };

  Pinnacle3.prototype.pause = function() {
    this.audio.pause();
    this.paused = true;
    this.target.classList.remove('playing');
    if (_animation_frame_id_ !== -1) {
      cancelAnimationFrame(_animation_frame_id_);
      return _animation_frame_id_ = -1;
    }
  };

  Pinnacle3.prototype.toggle = function() {
    if (this.paused) {
      return this.play();
    } else {
      return this.pause();
    }
  };

  Pinnacle3.prototype.average = function(array) {
    var j, len, sum, val;
    sum = 0;
    for (j = 0, len = array.length; j < len; j++) {
      val = array[j];
      sum += val;
    }
    return sum / array.length;
  };

  Pinnacle3.prototype.animate = function() {
    var avg, bar, chunkSize, col, freqs, i, idx, j, len, middle, ref;
    this.analyser.getByteFrequencyData(this.audioData);
    middle = ~~(this.bars.length / 2) + 1;
    chunkSize = ~~(this.audioData.length / middle);
    i = 0;
    ref = this.bars;
    for (j = 0, len = ref.length; j < len; j++) {
      bar = ref[j];
      if (i < middle) {
        idx = middle - i - 1;
      } else {
        idx = i - middle + 1;
      }
      freqs = this.audioData.slice(chunkSize * idx, chunkSize * (idx + 1));
      avg = this.average(freqs);
      bar.setHeight(avg);
      i += 1;
    }
    avg = this.average(this.audioData);
    col = Bar.computeColor(avg, this.hue, this.range, this.lightOffset + 20);
    this.particleSystem.rotation.y += .0003 + ((Math.pow(avg, 4) / Math.pow(255, 4)) / 10);
    this.particleSystem.material.size = 4 + (Math.pow(avg, 4) / Math.pow(255, 3));
    this.particleSystem.material.color = col;
    this.renderer.clear();
    this.composer.render();
    return _animation_frame_id_ = requestAnimationFrame(this.animate.bind(this));
  };

  return Pinnacle3;

})();
});

;require.register("srcs/bar.coffee", function(exports, require, module) {
var Bar;

module.exports = Bar = (function() {
  Bar.computeColor = function(value, hue, range, lightOffset) {
    var col, light;
    col = tinycolor('hsl(0, 100%, 50%)').toHsl();
    col.h = (hue + (range * (value / 255))) % 360;
    light = Math.min(((value / 255) * 100) + lightOffset, 100);
    if (light < 1) {
      light += 1.0;
    }
    if (light === 1) {
      light = 1.1;
    }
    col.l = light;
    return new THREE.Color(tinycolor(col).toHslString());
  };

  function Bar(scene, index, params) {
    this.index = index;
    this.params = params;
    this.material = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF
    });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), this.material);
    this.mesh.position.set((this.index - 50) * 4, 0, 0);
    this.hue = (this.params.color && this.params.color.hue) || 0;
    this.range = (this.params.color && this.params.color.range) || 45;
    this.lightOffset = (this.params.color && this.params.color.lightOffset) || 5;
    scene.add(this.mesh);
  }

  Bar.prototype.setHeight = function(height) {
    var scale;
    scale = Math.abs(height) / 10.0;
    if (scale < 0.1) {
      scale = 0.01;
    }
    this.mesh.scale.y = scale;
    this.mesh.scale.z = scale;
    return this.mesh.material.color = Bar.computeColor(height, this.hue, this.range, this.lightOffset);
  };

  return Bar;

})();
});

;require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');

/* jshint ignore:start */
(function() {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  var br = window.brunch = (window.brunch || {});
  var ar = br['auto-reload'] = (br['auto-reload'] || {});
  if (!WebSocket || ar.disabled) return;
  if (window._ar) return;
  window._ar = true;

  var cacheBuster = function(url){
    var date = Math.round(Date.now() / 1000).toString();
    url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') +'cacheBuster=' + date;
  };

  var browser = navigator.userAgent.toLowerCase();
  var forceRepaint = ar.forceRepaint || browser.indexOf('chrome') > -1;

  var reloaders = {
    page: function(){
      window.location.reload(true);
    },

    stylesheet: function(){
      [].slice
        .call(document.querySelectorAll('link[rel=stylesheet]'))
        .filter(function(link) {
          var val = link.getAttribute('data-autoreload');
          return link.href && val != 'false';
        })
        .forEach(function(link) {
          link.href = cacheBuster(link.href);
        });

      // Hack to force page repaint after 25ms.
      if (forceRepaint) setTimeout(function() { document.body.offsetHeight; }, 25);
    },

    javascript: function(){
      var scripts = [].slice.call(document.querySelectorAll('script'));
      var textScripts = scripts.map(function(script) { return script.text }).filter(function(text) { return text.length > 0 });
      var srcScripts = scripts.filter(function(script) { return script.src });

      var loaded = 0;
      var all = srcScripts.length;
      var onLoad = function() {
        loaded = loaded + 1;
        if (loaded === all) {
          textScripts.forEach(function(script) { eval(script); });
        }
      }

      srcScripts
        .forEach(function(script) {
          var src = script.src;
          script.remove();
          var newScript = document.createElement('script');
          newScript.src = cacheBuster(src);
          newScript.async = true;
          newScript.onload = onLoad;
          document.head.appendChild(newScript);
        });
    }
  };
  var port = ar.port || 9485;
  var host = br.server || window.location.hostname || 'localhost';

  var connect = function(){
    var connection = new WebSocket('ws://' + host + ':' + port);
    connection.onmessage = function(event){
      if (ar.disabled) return;
      var message = event.data;
      var reloader = reloaders[message] || reloaders.page;
      reloader();
    };
    connection.onerror = function(){
      if (connection.readyState) connection.close();
    };
    connection.onclose = function(){
      window.setTimeout(connect, 1000);
    };
  };
  connect();
})();
/* jshint ignore:end */

;
//# sourceMappingURL=pinnacle3.js.map