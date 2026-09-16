/* ============================================================
   苗绣专题站 · 全局脚本
   1) 移动端汉堡导航（焦点陷阱 / Esc 关闭 / 还原焦点）
   2) 动画减弱设置（跟随系统，可手动覆盖，localStorage 持久化）
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 动画减弱设置 ---------- */
  var MOTION_KEY = 'mx.motionPreference'; // 'auto' | 'on' | 'off'

  function systemPrefersReduced() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function motionIsOff() {
    var pref = null;
    try { pref = localStorage.getItem(MOTION_KEY); } catch (e) {}
    if (pref === 'off') return true;
    if (pref === 'on') return false;
    return systemPrefersReduced();
  }

  function applyMotion() {
    var off = motionIsOff();
    document.documentElement.classList.toggle('motion-off', off);
    document.documentElement.classList.toggle('allow-anim', !off);
    document.querySelectorAll('[data-motion-checkbox]').forEach(function (cb) {
      cb.checked = off;
      cb.setAttribute('aria-checked', String(off));
    });
  }

  window.MiaoMotion = {
    isOff: motionIsOff,
    set: function (value) {
      try { localStorage.setItem(MOTION_KEY, value); } catch (e) {}
      applyMotion();
      document.dispatchEvent(new CustomEvent('motionchange', {
        detail: { reduced: motionIsOff() }
      }));
    },
    get: function () {
      var v = null;
      try { v = localStorage.getItem(MOTION_KEY); } catch (e) {}
      return v || 'auto';
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyMotion();

    document.querySelectorAll('[data-motion-checkbox]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        window.MiaoMotion.set(cb.checked ? 'off' : 'on');
      });
    });

    // 系统设置变化时，“自动”模式即时跟随
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      var handler = function () {
        var pref = window.MiaoMotion.get();
        if (pref === 'auto') applyMotion();
      };
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else if (mq.addListener) mq.addListener(handler);
    }

    /* ---------- 汉堡导航 ---------- */
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');

    if (toggle && nav) {
      var FOCUSABLE = [
        'a[href]', 'button:not([disabled])', 'input:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',');

      function isMobile() {
        return window.getComputedStyle(toggle).display !== 'none';
      }

      function openMenu() {
        nav.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-lock');
        var first = nav.querySelector(FOCUSABLE);
        if (first) first.focus();
      }

      function closeMenu(restoreFocus) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-lock');
        if (restoreFocus !== false) toggle.focus();
      }

      toggle.addEventListener('click', function () {
        if (nav.classList.contains('is-open')) closeMenu();
        else openMenu();
      });

      // Esc 关闭
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) {
          closeMenu();
        }

        // 打开时焦点陷阱
        if (e.key === 'Tab' && nav.classList.contains('is-open') && isMobile()) {
          var items = Array.prototype.slice.call(nav.querySelectorAll(FOCUSABLE))
            .filter(function (el) { return el.offsetParent !== null; });
          if (!items.length) return;
          var firstEl = items[0];
          var lastEl = items[items.length - 1];
          if (e.shiftKey && document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      });

      // 点击菜单项后收起（移动端）
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a') && isMobile() && nav.classList.contains('is-open')) {
          closeMenu(false);
        }
      });

      // 视口拉宽到桌面时复位状态，避免残留
      window.addEventListener('resize', function () {
        if (!isMobile() && nav.classList.contains('is-open')) {
          closeMenu(false);
        }
      });
    }

    // 页脚年份
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  });
})();
