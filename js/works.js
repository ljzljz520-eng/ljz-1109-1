/* ============================================================
   代表作品：从 data/works.json 加载并渲染
   支持地区筛选与状态文案
   ============================================================ */
(function () {
  'use strict';

  function $(s) { return document.querySelector(s); }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function cardHtml(w) {
    var svg = window.MiaoMotifs
      ? window.MiaoMotifs.render(w.motif, w.palette, w.title)
      : '';
    return '' +
      '<article class="card work-card reveal">' +
        '<div class="motif-frame">' + svg + '</div>' +
        '<div class="card-body">' +
          '<h3>' + esc(w.title) + '</h3>' +
          '<p class="meta">' + esc(w.dynasty) + ' · ' + esc(w.region) + '</p>' +
          '<p class="technique-line">针法：' + esc(w.technique) + '</p>' +
          '<p>' + esc(w.description) + '</p>' +
          '<div class="swatch-row" aria-label="代表配色">' +
            w.palette.map(function (c) {
              return '<span class="swatch" style="background:' + c + '" title="' + c + '"></span>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function render(list, grid) {
    if (!list.length) {
      grid.innerHTML = '<p class="loading">该地区暂无展陈条目。</p>';
      return;
    }
    grid.innerHTML = list.map(cardHtml).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = $('[data-works-grid]');
    if (!grid) return;
    var filterBar = $('[data-works-filters]');
    var all = [];

    fetch('data/works.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        all = json.works || [];

        // 生成地区筛选
        if (filterBar) {
          var regions = Array.from(new Set(all.map(function (w) {
            return w.region.replace(/^(贵州|湖南|云南|广西|四川).*/, function (m) {
              return m.slice(0, 2);
            });
          }))).sort();
          regions.forEach(function (region) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'filter-btn';
            b.setAttribute('aria-pressed', 'false');
            b.textContent = region;
            b.dataset.region = region;
            b.addEventListener('click', function () {
              var active = b.getAttribute('aria-pressed') === 'true';
              $all(filterBar).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
              if (active) {
                b.setAttribute('aria-pressed', 'false');
                render(all, grid);
              } else {
                b.setAttribute('aria-pressed', 'true');
                render(all.filter(function (w) { return w.region.indexOf(region) === 0; }), grid);
              }
            });
            filterBar.appendChild(b);
          });
          var allBtn = filterBar.querySelector('[data-all]');
          if (allBtn) {
            allBtn.addEventListener('click', function () {
              $all(filterBar).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
              allBtn.setAttribute('aria-pressed', 'true');
              render(all, grid);
            });
          }
        }
        render(all, grid);
      })
      .catch(function () {
        grid.innerHTML =
          '<div class="load-error" role="alert">' +
          '作品数据加载失败。请通过本地静态服务器访问（如 <code>npm start</code>），不要直接用 file:// 打开。' +
          '</div>';
      });

    function $all(root) {
      return Array.prototype.slice.call(root.querySelectorAll('.filter-btn'));
    }
  });
})();
