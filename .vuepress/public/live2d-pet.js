/* 大肥鱼的 Live2D 看板娘
 * 依赖（在 config.js 的 head 里按顺序引入）：
 *   1. vendor/live2d/live2dcubismcore.min.js
 *   2. vendor/live2d/pixi.min.js
 *   3. vendor/live2d/pixi-live2d-display.cubism4.min.js
 *   4. live2d-pet.js（本文件）
 *
 * 模型：public/DeepSeek/大肥鱼.model3.json
 * 出处：模型 DeepSeek-chan（大肥鱼）｜原画及拆分 神宫凉子｜Live2D 建模 霓虹猫_NeonNeko
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var BASE = (script && script.dataset && script.dataset.base) || '/xiaozhan/';
  if (BASE.charAt(BASE.length - 1) !== '/') BASE += '/';

  var MODEL_URL = BASE + 'DeepSeek/' + encodeURIComponent('大肥鱼.model3.json');
  var KEY = 'dfy_l2d';
  // 手机屏幕小，看板娘缩到 150×212，不挡内容
  var SMALL = window.innerWidth < 760;
  var W = SMALL ? 150 : 240;
  var H = SMALL ? 212 : 340;

  function store(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  function load(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  var smallScreen = SMALL;
  var pref = load(KEY);
  var show = pref ? pref === 'on' : !smallScreen;

  // ---------- 外壳：容器 + 开关 ----------
  var box = document.createElement('div');
  box.id = 'dfy-l2d';
  box.style.cssText = [
    'position:fixed', 'right:0', 'bottom:0', 'width:' + W + 'px', 'height:' + H + 'px',
    'z-index:60', 'pointer-events:none', 'opacity:0', 'transition:opacity .6s ease',
    'user-select:none', '-webkit-user-select:none'
  ].join(';');

  var cv = document.createElement('canvas');
  cv.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none';
  box.appendChild(cv);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.title = '显示/隐藏大肥鱼';
  btn.textContent = '鱼';
  btn.style.cssText = [
    'position:absolute', 'right:4px', 'top:6px', 'width:26px', 'height:26px',
    'border-radius:50%', 'border:1px solid rgba(120,180,255,.45)',
    'background:rgba(18,26,40,.55)', 'color:#9fc9ff', 'font-size:13px', 'line-height:1',
    'cursor:pointer', 'pointer-events:auto', 'padding:0', 'backdrop-filter:blur(3px)',
    'opacity:.42', 'transition:opacity .25s ease'
  ].join(';');
  btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
  btn.addEventListener('mouseleave', function () { btn.style.opacity = '.42'; });

  var tip = document.createElement('div');
  tip.innerHTML = '模型 DeepSeek-chan（大肥鱼）<br>原画 神宫凉子 · Live2D 霓虹猫_NeonNeko';
  tip.style.cssText = [
    'position:absolute', 'left:0', 'right:0', 'bottom:0', 'height:22px', 'overflow:hidden',
    'white-space:normal', 'text-align:center', 'font-size:8px', 'line-height:11px',
    'color:rgba(205,220,240,.62)', 'background:rgba(8,12,20,.38)',
    'pointer-events:none', 'letter-spacing:.2px', 'border-radius:0 0 2px 2px'
  ].join(';');

  box.appendChild(btn);
  box.appendChild(tip);

  document.addEventListener('DOMContentLoaded', mount);
  if (document.readyState !== 'loading') mount();

  function mount() {
    if (document.body && !box.parentNode) document.body.appendChild(box);
    btn.addEventListener('click', function () {
      show = !show;
      store(KEY, show ? 'on' : 'off');
      if (show) start();
      else if (app) box.style.opacity = '0';
      if (!show && app) app.ticker.stop();
      if (show && app) app.ticker.start();
    });

    if (show) {
      var go = function () { setTimeout(start, 900); };
      if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 2500 });
      else go();
    }
  }

  // ---------- 真正加载 ----------
  var app = null, model = null, started = false, sway = 0;

  function ready() {
    return !!(window.PIXI && window.PIXI.live2d && window.PIXI.live2d.Live2DModel);
  }

  function start() {
    if (started || !document.body) return;
    if (!ready()) {
      // 库还没到（defer 顺序异常或缓存），1.2s 后重试，最多 8 次
      start._try = (start._try || 0) + 1;
      if (start._try < 8) setTimeout(start, 1200);
      return;
    }
    started = true;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    app = new PIXI.Application({
      view: cv,
      width: W,
      height: H,
      transparent: true,
      antialias: true,
      autoDensity: true,
      resolution: dpr,
      backgroundAlpha: 0
    });
    app.ticker.maxFPS = 30;

    var placeholder = new PIXI.Text('…', { fontSize: 14, fill: 0x7f9dc4 });
    placeholder.x = W / 2;
    placeholder.y = H - 20;
    placeholder.anchor.set(0.5);
    app.stage.addChild(placeholder);

    PIXI.live2d.Live2DModel.from(MODEL_URL, {
      autoInteract: false,
      autoUpdate: true
    }).then(function (m) {
      model = m;
      app.stage.addChildAt(m, 0);
      fit(m);

      placeholder.text = '';
      placeholder.visible = false;
      box.style.opacity = '1';

      // 让角色看向鼠标
      var follow = function (e) {
        if (!model) return;
        var r = cv.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        try { model.focus(x, (r.height - y) * 0.9); } catch (err) {}
      };
      window.addEventListener('mousemove', follow, { passive: true });

      // 轻微的待机摇摆（模型本身没有动作文件）
      var t0 = performance.now();
      app.ticker.add(function () {
        try {
          var t = (performance.now() - t0) / 1000;
          var core = model.internalModel.coreModel;
          var ax = Math.sin(t * 0.9) * 6;
          var ay = Math.sin(t * 0.62 + 0.8) * 4;
          var br = Math.sin(t * 1.5) * 0.5 + 0.5;
          setP(core, 'ParamAngleX', ax);
          setP(core, 'ParamAngleY', ay);
          setP(core, 'ParamBodyAngleZ', Math.sin(t * 0.5) * 3);
          setP(core, 'ParamBreath', br);
          setP(core, 'ParamEyeBallX', ax / 45);
          setP(core, 'ParamEyeBallY', ay / 45);
        } catch (e) {}
      });

      document.addEventListener('visibilitychange', function () {
        if (!app) return;
        if (document.hidden) app.ticker.stop();
        else if (show) app.ticker.start();
      });

      window.addEventListener('resize', function () { if (model) fit(model); });
    }).catch(function (err) {
      placeholder.text = '没加载出来';
      console.warn('[dfy-l2d]', err);
    });
  }

  function setP(core, id, v) {
    try {
      if (core.getParameterIndex && core.getParameterIndex(id) === -1) return;
      core.setParameterValueById(id, v);
    } catch (e) {}
  }

  // 等比缩放，脚底贴住容器底部、水平居中
  function fit(m) {
    var iw = m.internalModel.width || W;
    var ih = m.internalModel.height || H;
    var k = Math.min(W / iw, H / ih);
    m.scale.set(k);
    m.anchor.set(0.5, 1);
    m.x = W / 2;
    m.y = H;
  }
})();
