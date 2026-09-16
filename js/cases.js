/* ============================================================
   当代设计案例：从 data/contemporary.json 加载
   ============================================================ */
(function () {
  'use strict';

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('[data-cases-grid]');
    if (!grid) return;

    fetch('data/contemporary.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        var list = json.cases || [];
        grid.innerHTML = list.map(function (c) {
          return '' +
            '<article class="card case-card reveal">' +
              '<div class="card-body">' +
                '<p class="year">' + esc(c.year) + ' · ' + esc(c.category) + '</p>' +
                '<h3>' + esc(c.title) + '</h3>' +
                '<p>' + esc(c.summary) + '</p>' +
                '<div class="tags">' +
                  c.tags.map(function (t) { return '<span class="tag gold">' + esc(t) + '</span>'; }).join('') +
                '</div>' +
              '</div>' +
            '</article>';
        }).join('');
        if (json.note) {
          var note = document.querySelector('[data-cases-note]');
          if (note) note.textContent = json.note;
        }
      })
      .catch(function () {
        grid.innerHTML =
          '<div class="load-error" role="alert">案例数据加载失败，请通过本地静态服务器访问本站。</div>';
      });
  });
})();
