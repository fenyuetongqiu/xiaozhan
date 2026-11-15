/* ============================================================
   大肥鱼的小站 · 换头像
   存浏览器本地（localStorage），不上传服务器
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'dfy-face';
  var LOGO_KEY = 'dfy-logo';
  var PRESETS = [
    { src: '/figures/me.webp', name: '站着的我' },
    { src: '/figures/hi.webp', name: '打招呼' },
    { src: '/figures/pat.webp', name: '摸摸头' },
    { src: '/figures/lazy.webp', name: '晒太阳' },
    { src: '/figures/sleep.webp', name: '睡着了' }
  ];

  var lastFace = null;
  var lastLogo = null;

  function read(k) {
    try { return localStorage.getItem(k) || ''; } catch (e) { return ''; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
  }

  // 页面上所有「脸」：首屏大图、导航 logo、侧栏作者头像
  function faces() {
    return Array.prototype.slice.call(document.querySelectorAll(
      '.sidebar .personal-img, .author-avatar img'
    ));
  }

  // 只在值变化时才碰 DOM，避免每帧重排
  function apply(face, logo) {
    var list = faces();
    for (var i = 0; i < list.length; i++) {
      var img = list[i];
      var isLogo = false;
      var want = isLogo ? (logo || '/logo.png') : face;
      if (!want) continue;
      if (img.getAttribute('src') === want) continue;
      img.setAttribute('src', want);
    }
  }

  function paint(force) {
    var face = read(KEY);
    var logo = read(LOGO_KEY);
    if (!force && face === lastFace && logo === lastLogo) return;
    lastFace = face;
    lastLogo = logo;
    apply(face, logo);
  }

  // ---------- 面板 ----------
  function buildPanel() {
    var wrap = document.createElement('div');
    wrap.className = 'dfy-face-mask';
    wrap.innerHTML =
      '<div class="dfy-face-box">' +
      '  <div class="dfy-face-head"><b>换个头像</b><span class="dfy-face-tip">只存在你自己浏览器里</span></div>' +
      '  <div class="dfy-face-grid"></div>' +
      '  <div class="dfy-face-foot">' +
      '    <label class="dfy-face-up">自己传一张<input type="file" accept="image/*" hidden></label>' +
      '    <button class="dfy-face-reset">改回默认</button>' +
      '    <button class="dfy-face-close">好了</button>' +
      '  </div>' +
      '</div>';

    var grid = wrap.querySelector('.dfy-face-grid');
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'dfy-face-item';
      b.title = p.name;
      b.innerHTML = '<img src="' + p.src + '" alt="" loading="lazy"><span>' + p.name + '</span>';
      b.addEventListener('click', function () {
        if (!write(KEY, p.src)) { flash('浏览器不让存，换个方式'); return; }
        lastFace = null; paint(true);
        flash('换好啦 (๑•̀ㅂ•́)✧');
        close();
      });
      grid.appendChild(b);
    });

    wrap.querySelector('.dfy-face-close').addEventListener('click', close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('.dfy-face-reset').addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (e) { }
      lastFace = null; paint(true);
      flash('回到默认的我了');
      close();
    });

    // 自己传一张：压到 300×300 再存，免得把 localStorage 撑爆
    wrap.querySelector('input[type=file]').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var S = 300;
          // 1. 原图缩到不超 900，省内存
          var scale = Math.min(1, 900 / Math.max(im.width, im.height));
          var w = Math.round(im.width * scale), h = Math.round(im.height * scale);
          var tmp = document.createElement('canvas');
          tmp.width = w; tmp.height = h;
          var tctx = tmp.getContext('2d');
          tctx.drawImage(im, 0, 0, w, h);

          // 2. 把四边的纯白 / 透明边裁掉（截图带白边时这一步最要紧）
          var box = { x: 0, y: 0, w: w, h: h };
          try {
            var data = tctx.getImageData(0, 0, w, h).data;
            var minX = w, minY = h, maxX = -1, maxY = -1;
            for (var y = 0; y < h; y++) {
              for (var x = 0; x < w; x++) {
                var i = (y * w + x) * 4;
                if (data[i + 3] < 10) continue;
                if (data[i] > 246 && data[i + 1] > 246 && data[i + 2] > 246) continue;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
            if (maxX > minX && maxY > minY) {
              box = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
            }
          } catch (err) { }

          // 3. 从画面范围里取正中方形
          var side = Math.min(box.w, box.h);
          var sx = box.x + (box.w - side) / 2;
          var sy = box.y + (box.h - side) / 2;

          var c = document.createElement('canvas');
          c.width = c.height = S;
          var ctx = c.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(tmp, sx, sy, side, side, 0, 0, S, S);

          var url = c.toDataURL('image/jpeg', 0.84);
          if (!write(KEY, url)) { flash('图太大了，没存下'); return; }
          lastFace = null; paint(true);
          flash('这张不错');
          close();
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(f);
    });

    document.body.appendChild(wrap);
    return wrap;
  }

  var panel = null;
  function open() {
    if (!panel) panel = buildPanel();
    panel.classList.add('on');
  }
  function close() { if (panel) panel.classList.remove('on'); }

  var flashEl = null, flashTimer = 0;
  function flash(text) {
    if (!flashEl) {
      flashEl = document.createElement('div');
      flashEl.className = 'dfy-flash';
      document.body.appendChild(flashEl);
    }
    flashEl.textContent = text;
    flashEl.classList.add('on');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { flashEl.classList.remove('on'); }, 1800);
  }

  function mountButton() {
    // 点侧栏那张头像就能换（不再挂浮动按钮）
    document.addEventListener('click', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG') return;
      if (img.classList.contains('personal-img') || img.classList.contains('author-avatar')) {
        e.preventDefault();
        open();
      }
    }, true);
  }

  function boot() {
    paint(true);
    mountButton();
    // 换页时补一次，别用 MutationObserver（滚动会疯狂触发，卡）
    setInterval(function () { paint(true); }, 1200);
    window.addEventListener('popstate', function () { setTimeout(function () { paint(true); }, 300); });
    window.addEventListener('hashchange', function () { setTimeout(function () { paint(true); }, 300); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();




