/* ============================================================
   苗绣纹样 SVG 渲染器
   将 data/patterns.json 中的 motif 键转为内联 SVG 装饰图
   ============================================================ */
(function () {
  'use strict';

  var PALETTE = ['#b3402e', '#0f7b6c', '#c9a24b', '#16324f'];

  function P(path, attrs) {
    attrs = attrs || {};
    var s = '<path d="' + path + '"';
    Object.keys(attrs).forEach(function (k) {
      s += ' ' + k + '="' + attrs[k] + '"';
    });
    return s + '/>';
  }
  function C(cx, cy, r, fill) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"/>';
  }

  var MOTIFS = {
    butterfly: function (c) {
      var body = 'M50 22 C48 42 48 62 50 82';
      return '' +
        P(body, { fill: 'none', stroke: c[3], 'stroke-width': 3, 'stroke-linecap': 'round' }) +
        // 上翅
        P('M50 30 C28 6 4 14 8 36 C11 52 32 50 50 42 Z', { fill: c[0], 'fill-opacity': 0.22, stroke: c[0], 'stroke-width': 2.4 }) +
        P('M50 30 C72 6 96 14 92 36 C89 52 68 50 50 42 Z', { fill: c[0], 'fill-opacity': 0.22, stroke: c[0], 'stroke-width': 2.4 }) +
        // 下翅
        P('M50 46 C30 46 12 58 16 74 C20 90 40 84 50 64 Z', { fill: c[1], 'fill-opacity': 0.25, stroke: c[1], 'stroke-width': 2.4 }) +
        P('M50 46 C70 46 88 58 84 74 C80 90 60 84 50 64 Z', { fill: c[1], 'fill-opacity': 0.25, stroke: c[1], 'stroke-width': 2.4 }) +
        P('M50 22 l-5 -8 M50 22 l5 -8', { fill: 'none', stroke: c[3], 'stroke-width': 2, 'stroke-linecap': 'round' }) +
        C(50, 20, 2.6, c[3]) +
        C(30, 30, 3.2, c[2]) + C(70, 30, 3.2, c[2]) +
        C(32, 66, 2.8, c[2]) + C(68, 66, 2.8, c[2]);
    },
    maple: function (c) {
      var lobes =
        'M50 12 L57 30 L76 20 L67 38 L88 40 L68 48 L78 66 L58 56 L50 76 L42 56 L22 66 L32 48 L12 40 L33 38 L24 20 L43 30 Z';
      return '' +
        P(lobes, { fill: c[0], 'fill-opacity': 0.18, stroke: c[0], 'stroke-width': 2.4, 'stroke-linejoin': 'round' }) +
        P('M50 34 V56 M50 44 L38 40 M50 44 L62 40 M50 52 L40 54 M50 52 L60 54',
          { fill: 'none', stroke: c[1], 'stroke-width': 1.8, 'stroke-linecap': 'round' }) +
        P('M50 76 V92', { fill: 'none', stroke: c[3], 'stroke-width': 2.6, 'stroke-linecap': 'round' }) +
        C(50, 26, 2.6, c[2]) + C(42, 46, 2.2, c[2]) + C(58, 46, 2.2, c[2]);
    },
    dragon: function (c) {
      return '' +
        // 螺旋身体
        P('M84 70 C84 50 58 46 52 60 C47 72 66 78 70 66',
          { fill: 'none', stroke: c[0], 'stroke-width': 7, 'stroke-linecap': 'round' }) +
        P('M84 70 C84 50 58 46 52 60 C47 72 66 78 70 66',
          { fill: 'none', stroke: c[2], 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '2 6' }) +
        // 头
        P('M70 64 l14 -12 l-3 13 Z', { fill: c[0], 'fill-opacity': 0.25, stroke: c[0], 'stroke-width': 2, 'stroke-linejoin': 'round' }) +
        P('M82 53 l4 -8 M86 56 l8 -5', { stroke: c[3], 'stroke-width': 2, 'stroke-linecap': 'round' }) +
        C(81, 57, 2.4, c[3]) +
        // 锯齿尾
        P('M84 70 l10 2 l-8 6 l10 2 l-9 5', { fill: 'none', stroke: c[1], 'stroke-width': 2.2, 'stroke-linejoin': 'round' }) +
        C(26, 40, 3, c[1]) + C(20, 56, 2.4, c[1]) + C(30, 72, 2.8, c[1]);
    },
    bird: function (c) {
      return '' +
        // 尾羽
        P('M22 62 C14 70 12 80 18 88 C24 80 30 76 38 74',
          { fill: 'none', stroke: c[1], 'stroke-width': 3, 'stroke-linecap': 'round' }) +
        // 身
        P('M34 66 C34 50 48 42 60 48 C72 54 70 70 56 74 C46 77 36 74 34 66 Z',
          { fill: c[0], 'fill-opacity': 0.2, stroke: c[0], 'stroke-width': 2.4 }) +
        // 翅
        P('M42 60 C50 52 62 54 64 62 C56 60 50 64 44 70 Z',
          { fill: c[1], 'fill-opacity': 0.3, stroke: c[1], 'stroke-width': 2 }) +
        // 头冠喙
        C(60, 47, 8, 'none') +
        P('M58 40 l3 -9 l3 9 Z', { fill: c[2], stroke: c[2], 'stroke-width': 1.6 }) +
        P('M68 47 l10 -3 l-9 6 Z', { fill: c[2], stroke: c[3], 'stroke-width': 1.6, 'stroke-linejoin': 'round' }) +
        C(62, 45, 2, c[3]) +
        // 腿
        P('M48 74 v10 M58 74 v10 M48 84 l-5 3 M58 84 l5 3',
          { stroke: c[3], 'stroke-width': 2, 'stroke-linecap': 'round' });
    },
    fish: function (c) {
      return '' +
        P('M14 50 C24 30 56 28 70 48 C56 72 24 70 14 50 Z',
          { fill: c[0], 'fill-opacity': 0.2, stroke: c[0], 'stroke-width': 2.4 }) +
        P('M70 48 L90 34 L86 50 L90 66 Z',
          { fill: c[1], 'fill-opacity': 0.3, stroke: c[1], 'stroke-width': 2.4, 'stroke-linejoin': 'round' }) +
        C(26, 45, 2.8, c[3]) +
        P('M36 42 q6 8 0 16 M48 38 q6 12 0 24 M58 42 q5 8 0 14',
          { fill: 'none', stroke: c[2], 'stroke-width': 1.8, 'stroke-linecap': 'round' }) +
        P('M30 58 q8 6 16 0', { fill: 'none', stroke: c[1], 'stroke-width': 1.6 }) +
        C(84, 42, 2, c[2]) + C(90, 56, 2, c[2]);
    },
    drum: function (c) {
      var rings = '';
      [36, 28, 20, 12].forEach(function (r) {
        rings += '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' + c[0] + '" stroke-width="2"/>';
      });
      var rays = '';
      for (var a = 0; a < 360; a += 30) {
        var rad = (a - 90) * Math.PI / 180;
        var x1 = 50 + Math.cos(rad) * 14;
        var y1 = 50 + Math.sin(rad) * 14;
        var x2 = 50 + Math.cos(rad) * 26;
        var y2 = 50 + Math.sin(rad) * 26;
        rays += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
          '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
          '" stroke="' + c[2] + '" stroke-width="2.4" stroke-linecap="round"/>';
      }
      return rings + rays +
        C(50, 50, 7, c[0]) +
        P('M14 50 H22 M78 50 H86 M50 14 V22 M50 78 V86',
          { stroke: c[1], 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    },
    river: function (c) {
      return '' +
        P('M8 30 H92 M8 50 H92 M8 70 H92',
          { stroke: c[3], 'stroke-width': 1.6, 'stroke-dasharray': '2 6' }) +
        P('M10 34 L26 24 L42 34 L58 24 L74 34 L90 24',
          { fill: 'none', stroke: c[0], 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }) +
        P('M10 54 L26 44 L42 54 L58 44 L74 54 L90 44',
          { fill: 'none', stroke: c[1], 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }) +
        P('M10 74 L26 64 L42 74 L58 64 L74 74 L90 64',
          { fill: 'none', stroke: c[2], 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }) +
        P('M10 24 V84 M42 24 V84 M74 24 V84',
          { stroke: c[0], 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: '0.6' });
    },
    city: function (c) {
      return '' +
        P('M12 84 H88', { stroke: c[3], 'stroke-width': 2.6, 'stroke-linecap': 'round' }) +
        P('M18 84 V56 H34 V84 Z M38 84 V44 H56 V84 Z M60 84 V58 H78 V84 Z',
          { fill: c[1], 'fill-opacity': 0.18, stroke: c[1], 'stroke-width': 2.2, 'stroke-linejoin': 'round' }) +
        P('M42 52 h4 v-6 h4 v6 M64 66 h4 v-5 h4 v5 M22 64 h4 v-5 h4 v5',
          { stroke: c[0], 'stroke-width': 1.8 }) +
        P('M38 44 l9 -10 l9 10', { fill: 'none', stroke: c[0], 'stroke-width': 2, 'stroke-linejoin': 'round' }) +
        C(47, 29, 2.4, c[2]) +
        P('M14 84 q8 -6 16 0 q8 -6 16 0 q8 -6 16 0 q8 -6 16 0',
          { fill: 'none', stroke: c[2], 'stroke-width': 1.8 }) +
        C(26, 76, 2, c[0]) + C(68, 76, 2, c[0]);
    },
    mountain: function (c) {
      return '' +
        P('M8 78 L28 38 L42 60 L52 28 L72 62 L84 44 L92 78 Z',
          { fill: c[0], 'fill-opacity': 0.18, stroke: c[0], 'stroke-width': 2.4, 'stroke-linejoin': 'round' }) +
        P('M20 78 L34 54 M52 28 l-6 12 l12 -2 M72 62 l-8 -10',
          { stroke: c[1], 'stroke-width': 1.8, 'stroke-linecap': 'round' }) +
        P('M10 84 H90', { stroke: c[2], 'stroke-width': 2.4, 'stroke-linecap': 'round' }) +
        P('M14 84 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5',
          { fill: 'none', stroke: c[3], 'stroke-width': 1.6 });
    },
    flower: function (c) {
      var petals = '';
      for (var i = 0; i < 6; i++) {
        petals += '<ellipse cx="50" cy="30" rx="9" ry="14" ' +
          'fill="' + c[i % 2] + '" fill-opacity="0.25" stroke="' + c[i % 2] +
          '" stroke-width="2" transform="rotate(' + (i * 60) + ' 50 50)"/>';
      }
      return petals + C(50, 50, 8, c[2]) +
        P('M50 64 V88', { stroke: c[1], 'stroke-width': 2.6, 'stroke-linecap': 'round' }) +
        P('M50 78 q-10 -2 -14 -10 M50 72 q10 -2 14 -10',
          { fill: 'none', stroke: c[1], 'stroke-width': 2, 'stroke-linecap': 'round' });
    },
    geometric: function (c) {
      var s = '';
      [20, 36].forEach(function (g) {
        s += '<path d="M' + (50 - g) + ' 50 H' + (50 + g) + ' M50 ' + (50 - g) +
          ' V' + (50 + g) + '" stroke="' + c[3] + '" stroke-width="1.6" opacity="0.5"/>';
      });
      for (var x = 26; x <= 74; x += 12) {
        for (var y = 26; y <= 74; y += 12) {
          s += P('M' + (x - 4) + ' ' + (y - 4) + ' L' + (x + 4) + ' ' + (y + 4) +
            ' M' + (x + 4) + ' ' + (y - 4) + ' L' + (x - 4) + ' ' + (y + 4),
            { stroke: c[0], 'stroke-width': 2, 'stroke-linecap': 'round' });
        }
      }
      s += P('M50 8 L92 50 L50 92 L8 50 Z',
        { fill: 'none', stroke: c[1], 'stroke-width': 2.4 }) +
        C(50, 50, 4, c[2]);
      return s;
    }
  };

  function render(key, colors, label) {
    var draw = MOTIFS[key] || MOTIFS.geometric;
    var c = (colors && colors.length >= 2) ? colors : PALETTE;
    var content = draw(c);
    var aria = label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true" focusable="false"';
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"' + aria + '>' +
      content + '</svg>';
  }

  window.MiaoMotifs = { render: render, keys: Object.keys(MOTIFS) };

  // 静态页面里 data-motif 的占位元素自动填充
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-motif]').forEach(function (el) {
      var colors = el.getAttribute('data-colors');
      var palette = colors ? colors.split(',').map(function (s) { return s.trim(); }) : null;
      el.innerHTML = render(el.getAttribute('data-motif'), palette, el.getAttribute('data-label'));
    });
  });
})();
