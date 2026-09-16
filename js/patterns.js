/* ============================================================
   服饰纹样：从 data/patterns.json（patterns schema）渲染
   支持按分类筛选
   ============================================================ */
(function () {
  'use strict';

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('[data-patterns-grid]');
    if (!grid) return;
    var bar = document.querySelector('[data-pattern-filters]');
    var data = null;

    function cardHtml(p) {
      var svg = window.MiaoMotifs
        ? window.MiaoMotifs.render(p.motif, p.colors, p.name)
        : '';
      return '' +
        '<article class="card reveal" data-category="' + esc(p.category) + '">' +
          '<div class="motif-frame">' + svg + '</div>' +
          '<div class="card-body">' +
            '<h3>' + esc(p.name) + '</h3>' +
            '<p class="meta">常用于：' + esc(p.placement) + '</p>' +
            '<p>' + esc(p.description) + '</p>' +
            '<p style="margin-top:0.6rem;"><strong style="color:#7a1f2b;">寓意：</strong>' + esc(p.meaning) + '</p>' +
            '<div class="swatch-row" aria-label="纹样用色">' +
              p.colors.map(function (c) {
                return '<span class="swatch" style="background:' + c + '" title="' + c + '"></span>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</article>';
    }

    function render(filter) {
      var list = data.patterns.filter(function (p) {
        return !filter || p.category === filter;
      });
      grid.innerHTML = list.map(cardHtml).join('');
    }

    fetch('data/patterns.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        data = json;
        if (bar) {
          var allBtn = document.createElement('button');
          allBtn.type = 'button';
          allBtn.className = 'filter-btn';
          allBtn.setAttribute('aria-pressed', 'true');
          allBtn.textContent = '全部';
          allBtn.addEventListener('click', function () { setActive(allBtn); render(null); });
          bar.appendChild(allBtn);

          json.categories.forEach(function (cat) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'filter-btn';
            b.setAttribute('aria-pressed', 'false');
            b.textContent = cat.name;
            b.addEventListener('click', function () { setActive(b); render(cat.id); });
            bar.appendChild(b);
          });
        }
        render(null);
      })
      .catch(function () {
        grid.innerHTML =
          '<div class="load-error" role="alert">纹样数据加载失败，请通过本地静态服务器访问本站（如 <code>npm start</code>）。</div>';
      });

    function setActive(btn) {
      Array.prototype.forEach.call(bar.querySelectorAll('.filter-btn'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
    }
  });
})();
