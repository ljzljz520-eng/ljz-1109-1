/* ============================================================
   苗绣针法 · 分步演示播放器
   - 上一步 / 播放暂停 / 下一步 / 重置
   - 自动分步播放，速度可感知
   - 状态（当前针法、步骤、播放中）存入 localStorage，可断点恢复
   - 尊重并响应“减弱动态效果”设置
   ============================================================ */
(function () {
  'use strict';

  var DATA_URL = 'data/stitches.json';
  var STATE_KEY = 'mx.stitchPlayer.v1';
  var AUTOPLAY_MS = 1800;

  var state = {
    data: null,
    index: 0,            // 当前针法在数组中的位置
    step: 0,             // 当前已显示到第几步（0 表示仅布料）
    playing: false,
    timer: null,
    dismissed: false
  };

  var el = {};

  /* ---------- 工具 ---------- */
  function $(s, root) { return (root || document).querySelector(s); }
  function $all(s, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(s));
  }

  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        stitchId: currentStitch() ? currentStitch().id : null,
        step: state.step,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearSaved() {
    try { localStorage.removeItem(STATE_KEY); } catch (e) {}
  }

  function currentStitch() {
    return state.data && state.data.stitches[state.index];
  }

  function motionOff() {
    return window.MiaoMotion ? window.MiaoMotion.isOff() : false;
  }

  /* ---------- SVG 构建 ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'data-text') { node.textContent = attrs[k]; return; }
      node.setAttribute(k, attrs[k]);
    });
    return node;
  }

  function buildDiagram(stitch) {
    var d = stitch.diagram;
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', d.viewBox.join(' '));
    svg.setAttribute('class', 'diagram-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', stitch.name + '针法分步演示图');

    var fabric = d.fabric;
    svg.appendChild(svgEl('rect', {
      x: fabric.x, y: fabric.y, width: fabric.w, height: fabric.h,
      rx: 8, fill: fabric.fill, class: 'fabric-rect'
    }));

    d.steps.forEach(function (stepDef, i) {
      var g = svgEl('g', { class: 'step-layer', 'data-step': String(i + 1) });
      (stepDef.elements || []).forEach(function (item) {
        var node = svgEl(item.tag, item.attrs);
        g.appendChild(node);
      });
      svg.appendChild(g);
    });

    return svg;
  }

  function visibleLayers() { return $all('g.step-layer', el.svgMount); }

  /* ---------- 渲染 ---------- */
  function renderSteps() {
    var layers = visibleLayers();
    layers.forEach(function (g, i) {
      g.classList.toggle('is-on', i < state.step);
    });
    var total = currentStitch().diagram.steps.length;
    var ratio = total ? (state.step / total) * 100 : 0;
    el.progressFill.style.width = ratio + '%';
    el.readout.textContent = '第 ' + Math.max(state.step, 1) + ' / ' + total + ' 步';
    el.progress.setAttribute('aria-valuenow', String(state.step));
    el.progress.setAttribute('aria-valuemax', String(total));

    if (state.step === 0) {
      el.stepTitle.textContent = '准备';
      el.stepInstruction.textContent = '点击“播放”自动分步演示，也可用“上一步 / 下一步”手动观看。';
      el.stepIndex.textContent = '·';
    } else {
      var def = currentStitch().diagram.steps[state.step - 1];
      el.stepTitle.textContent = def.title;
      el.stepInstruction.textContent = def.instruction;
      el.stepIndex.textContent = String(state.step);
    }

    el.prev.disabled = state.step === 0;
    el.next.disabled = state.step === total;
    updatePlayButton();
  }

  function updatePlayButton() {
    var total = currentStitch().diagram.steps.length;
    var end = state.step >= total;
    if (state.playing) {
      el.play.textContent = '⏸ 暂停';
      el.play.setAttribute('aria-label', '暂停自动演示');
      el.play.disabled = false;
    } else {
      el.play.textContent = end ? '↻ 重新播放' : '▶ 播放';
      el.play.setAttribute('aria-label', end ? '重新播放分步演示' : '自动分步播放');
      el.play.disabled = motionOff();
      el.play.title = motionOff() ? '已开启“减弱动态效果”，请用上一步/下一步手动观看' : '';
    }
  }

  function renderInfo() {
    var s = currentStitch();
    el.info.innerHTML =
      '<h3>' + s.name + '</h3>' +
      '<p class="meta">别称：' + s.otherNames.join('、') + '</p>' +
      '<p>' + s.summary + '</p>' +
      '<table class="info-table">' +
        '<tr><th>难度</th><td>' + ({ low: '入门', medium: '中等', hard: '进阶' })[s.difficulty] + '</td></tr>' +
        '<tr><th>流行地区</th><td>' + s.region + '</td></tr>' +
        '<tr><th>主要用途</th><td>' + s.use + '</td></tr>' +
        '<tr><th>用线要点</th><td>' + s.thread + '</td></tr>' +
      '</table>';
  }

  function renderTabs() {
    el.tabs.innerHTML = '';
    state.data.stitches.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stitch-tab';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(i === state.index));
      b.textContent = s.name;
      b.addEventListener('click', function () { selectStitch(i, false); });
      el.tabs.appendChild(b);
    });
  }

  function selectStitch(i, keepStep) {
    stop();
    state.index = i;
    if (!keepStep) state.step = 0;
    var s = currentStitch();
    el.svgMount.innerHTML = '';
    el.svgMount.appendChild(buildDiagram(s));
    renderInfo();
    renderTabs();
    renderSteps();
    saveState();
  }

  /* ---------- 播放控制 ---------- */
  function goTo(step) {
    var total = currentStitch().diagram.steps.length;
    state.step = Math.max(0, Math.min(total, step));
    renderSteps();
    saveState();
  }

  function next() { goTo(state.step + 1); }
  function prev() { goTo(state.step - 1); }

  function play() {
    if (motionOff()) return;
    var total = currentStitch().diagram.steps.length;
    if (state.step >= total) state.step = 0;
    state.playing = true;
    renderSteps();
    state.timer = setInterval(function () {
      if (state.step >= total) { stop(false); return; }
      next();
    }, AUTOPLAY_MS);
  }

  function stop(resetButton) {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
    state.playing = false;
    if (resetButton !== false) renderSteps();
    else updatePlayButton();
    saveState();
  }

  function togglePlay() {
    if (state.playing) stop();
    else play();
  }

  function reset() {
    stop();
    state.step = 0;
    state.dismissed = false;
    el.banner.classList.remove('is-visible');
    renderSteps();
    clearSaved();
  }

  /* ---------- 断点恢复 ---------- */
  function offerResume() {
    var saved = loadSaved();
    if (!saved || !saved.stitchId || state.dismissed) return;
    if (saved.stitchId === currentStitch().id && saved.step === 0) return;
    el.bannerText.textContent =
      '上次看到「' + stitchName(saved.stitchId) + '」第 ' + saved.step + ' 步，是否继续？';
    el.banner.classList.add('is-visible');
    el.resumeBtn.onclick = function () {
      var idx = state.data.stitches.findIndex(function (s) { return s.id === saved.stitchId; });
      if (idx >= 0) {
        state.index = idx;
        var s = currentStitch();
        el.svgMount.innerHTML = '';
        el.svgMount.appendChild(buildDiagram(s));
        renderInfo();
        renderTabs();
        state.step = Math.min(saved.step || 0, s.diagram.steps.length);
        renderSteps();
      }
      el.banner.classList.remove('is-visible');
    };
    el.dismissBtn.onclick = function () {
      state.dismissed = true;
      el.banner.classList.remove('is-visible');
    };
  }

  function stitchName(id) {
    var s = state.data.stitches.find(function (x) { return x.id === id; });
    return s ? s.name : '';
  }

  /* ---------- 初始化 ---------- */
  function init(data) {
    state.data = data;

    el.tabs = $('#stitchTabs');
    el.svgMount = $('#diagramMount');
    el.info = $('#stitchInfo');
    el.play = $('#btnPlay');
    el.prev = $('#btnPrev');
    el.next = $('#btnNext');
    el.reset = $('#btnReset');
    el.progressFill = $('#progressFill');
    el.readout = $('#stepReadout');
    el.stepTitle = $('#stepTitle');
    el.stepInstruction = $('#stepInstruction');
    el.stepIndex = $('#stepIndex');
    el.progress = $('#progressBar');
    el.banner = $('#resumeBanner');
    el.bannerText = $('#resumeText');
    el.resumeBtn = $('#btnResume');
    el.dismissBtn = $('#btnDismissResume');

    var saved = loadSaved();
    var startIndex = 0;
    var startStep = 0;
    if (saved && saved.stitchId) {
      var idx = data.stitches.findIndex(function (s) { return s.id === saved.stitchId; });
      if (idx >= 0) { startIndex = idx; startStep = saved.step || 0; }
    }

    state.index = startIndex;
    state.step = 0;
    renderTabs();
    var s = currentStitch();
    el.svgMount.appendChild(buildDiagram(s));
    renderInfo();
    renderSteps();

    el.play.addEventListener('click', togglePlay);
    el.prev.addEventListener('click', prev);
    el.next.addEventListener('click', next);
    el.reset.addEventListener('click', reset);

    // 键盘：左右方向键分步
    document.addEventListener('keydown', function (e) {
      if (!document.body.dataset.page || document.body.dataset.page !== 'stitches') return;
      if (e.target.closest('input,textarea,a,button')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); prev(); }
    });

    // 离开页面 / 切后台时持久化
    window.addEventListener('pagehide', saveState);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(false); }
    });

    // 有历史进度时给出“继续观看”提示（不强制跳转）
    if (startStep > 0) {
      state.step = 0;
      renderSteps();
      offerResume();
    }
  }

  function fail() {
    var mount = document.querySelector('[data-stitch-app]');
    if (mount) {
      mount.innerHTML = '<div class="load-error" role="alert">针法数据加载失败。请通过本地静态服务器访问本站（如 <code>npm start</code>），不要直接用 file:// 打开。</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('[data-stitch-app]')) return;
    fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(init)
      .catch(fail);

    // 动画减弱开关变化时同步按钮状态
    document.addEventListener('motionchange', function () {
      if (motionOff() && state.playing) stop();
      else updatePlayButton();
    });
  });
})();
