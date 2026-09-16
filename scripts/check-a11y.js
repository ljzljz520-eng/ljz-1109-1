#!/usr/bin/env node
/* ============================================================
   苗绣专题站 · 自动化前端检查（零依赖，静态规则 + 结构断言）
   检查项：
   A. 移动端汉堡菜单：按钮存在、aria-expanded/controls、焦点陷阱、
      Esc 关闭、关闭后焦点还原、菜单默认收起
   B. 动画减弱：prefers-reduced-motion 媒体查询、手动开关、
      本地持久化键、脚本响应 motionchange
   C. 基础无障碍：html lang、跳转链接、main 地标、唯一 h1、
      图标按钮 aria-label、img/svg 可访问名、对比度色值提醒
   D. 数据/播放器 schema：stitches 分步数据、进度条 aria
   结果写入 reports/a11y-check.json，有失败项则退出码 1
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'reports');
fs.mkdirSync(REPORTS, { recursive: true });

const results = [];
function check(group, name, pass, detail) {
  results.push({ group, name, pass: !!pass, detail: detail || (pass ? '通过' : '未通过') });
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

const mainJs = read('js/main.js');
const playerJs = read('js/player.js');
const stylesCss = read('css/styles.css');
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const html = Object.fromEntries(htmlFiles.map(f => [f, read(f)]));

/* ---------- A. 移动端汉堡菜单焦点 ---------- */
check('nav', '每页都有汉堡按钮 data-nav-toggle',
  htmlFiles.every(f => /data-nav-toggle/.test(html[f])));
check('nav', '汉堡按钮含 aria-expanded 初始 false',
  /aria-expanded="false"[\s\S]*data-nav-toggle|data-nav-toggle[\s\S]{0,200}aria-expanded="false"/.test(mainJs) ||
  htmlFiles.every(f => /aria-expanded="false"/.test(html[f])));
check('nav', '汉堡按钮含 aria-controls 指向导航 id',
  htmlFiles.every(f => /aria-controls="primary-nav"/.test(html[f]) && /id="primary-nav"/.test(html[f])));
check('nav', '汉堡按钮具备可访问名称 aria-label',
  htmlFiles.every(f => {
    const btn = (html[f].match(/<button[^>]*data-nav-toggle[^>]*>/) || [''])[0];
    return /aria-label="[^"]+"/.test(btn);
  }));
check('nav', '菜单默认收起（CSS 中 .main-nav 默认隐藏）',
  /\.main-nav\s*\{[\s\S]*?visibility:\s*hidden/.test(stylesCss) &&
  /max-height:\s*0/.test(stylesCss));
check('nav', '打开态由 .is-open 控制',
  /\.main-nav\.is-open/.test(stylesCss) && /classList\.add\('is-open'\)/.test(mainJs));
check('nav', '实现焦点陷阱（Tab / Shift+Tab 首尾循环）',
  /key === 'Tab'/.test(mainJs) && /firstEl/.test(mainJs) && /lastEl/.test(mainJs) &&
  /preventDefault\(\)/.test(mainJs));
check('nav', '焦点选择器集合完整',
  /a\[href\]/.test(mainJs) && /button/.test(mainJs) && /tabindex/.test(mainJs));
check('nav', 'Esc 键关闭菜单',
  /key === 'Escape'/.test(mainJs) && /closeMenu\(\)/.test(mainJs));
check('nav', '关闭后焦点还原到汉堡按钮',
  /function closeMenu[\s\S]{0,300}toggle\.focus\(\)/.test(mainJs));
check('nav', '打开时焦点移入菜单首个可聚焦元素',
  /function openMenu[\s\S]{0,260}first\.focus\(\)/.test(mainJs));
check('nav', '桌面断点（720px）显示、移动端隐藏按钮样式存在',
  /@media \(max-width: 720px\)/.test(stylesCss) && /\.nav-toggle\s*\{[^}]*display:\s*none/.test(stylesCss));
check('nav', 'resize 到桌面时复位菜单状态',
  /window\.addEventListener\('resize'/.test(mainJs) && /closeMenu\(false\)/.test(mainJs));

/* ---------- B. 动画减弱 ---------- */
check('motion', 'CSS 含 prefers-reduced-motion 媒体查询',
  /@media \(prefers-reduced-motion: reduce\)/.test(stylesCss));
check('motion', '媒体查询中压制动画与过渡时长',
  /prefers-reduced-motion[\s\S]{0,400}animation-duration:\s*0\.001ms/.test(stylesCss) &&
  /transition-duration:\s*0\.001ms/.test(stylesCss));
check('motion', 'html.motion-off 类用于手动关闭动画',
  /html\.motion-off/.test(stylesCss));
check('motion', '页面提供“减弱动态效果”复选框开关',
  Object.values(html).filter(t => /data-motion-checkbox/.test(t)).length >= 2);
check('motion', '开关与 aria-checked 同步',
  /setAttribute\('aria-checked'/.test(mainJs));
check('motion', '默认读取系统 prefers-reduced-motion',
  /prefers-reduced-motion: reduce/.test(mainJs));
check('motion', '用户选择通过 localStorage 持久化',
  /localStorage/.test(mainJs) && /mx\.motionPreference/.test(mainJs));
check('motion', '系统设置变化时自动模式即时跟随',
  /addEventListener\('change'/.test(mainJs) || /addListener/.test(mainJs));
check('motion', '播放器在减弱模式下禁用自动播放并允许单步',
  /motionOff\(\)/.test(playerJs) && /play\.disabled = motionOff\(\)/.test(playerJs));
check('motion', '减弱模式开启时停止正在进行的播放',
  /motionchange[\s\S]{0,120}stop\(\)/.test(playerJs));

/* ---------- C. 基础无障碍与结构 ---------- */
check('a11y', '所有页面声明 <html lang="zh-CN">',
  htmlFiles.every(f => /<html lang="zh-CN">/.test(html[f])));
check('a11y', '所有页面含跳转到主内容的 skip-link',
  htmlFiles.every(f => /class="skip-link" href="#main"/.test(html[f])) &&
  htmlFiles.every(f => /<main id="main">/.test(html[f])));
check('a11y', '每页有且仅有一个 h1',
  htmlFiles.every(f => (html[f].match(/<h1[\s>]/g) || []).length === 1));
check('a11y', '标题层级：首页 h1 之后先出现 h2 再出现 h3（不跳级）',
  htmlFiles.every(f => {
    const firstH2 = html[f].search(/<h2[\s>]/);
    const firstH3 = html[f].search(/<h3[\s>]/);
    return firstH2 !== -1 && (firstH3 === -1 || firstH2 < firstH3);
  }));
check('a11y', '所有页面有 meta viewport 与 description',
  htmlFiles.every(f => /name="viewport"/.test(html[f]) && /name="description"/.test(html[f])));
check('a11y', '所有页面有 <title> 且非空',
  htmlFiles.every(f => /<title>[^<]+<\/title>/.test(html[f])));
check('a11y', '导航区域有 aria-label',
  htmlFiles.every(f => /<nav[^>]*aria-label="主导航"/.test(html[f])));
check('a11y', '动态内容区域使用 aria-live',
  /data-patterns-grid[^>]*aria-live="polite"/.test(html['patterns.html']) &&
  /data-works-grid[^>]*aria-live="polite"/.test(html['works.html']) &&
  /data-cases-grid[^>]*aria-live="polite"/.test(html['contemporary.html']));
check('a11y', '加载错误提供 role="alert"',
  /role="alert"/.test(read('js/works.js')) && /role="alert"/.test(read('js/patterns.js')));
check('a11y', 'SVG 纹样在装饰场景 aria-hidden、信息场景带 role=img+label',
  read('js/motifs.js').indexOf("role=\"img\"") !== -1 &&
  read('js/motifs.js').indexOf('aria-hidden=') !== -1 && read('js/motifs.js').indexOf('focusable=') !== -1 &&
  read('js/motifs.js').indexOf('aria-label=') !== -1);
check('a11y', '播放器进度条具备 role=progressbar 与 aria-value*',
  /role="progressbar"/.test(html['stitches.html']) &&
  /aria-valuemin/.test(html['stitches.html']) && /aria-valuemax/.test(html['stitches.html']));
check('a11y', '分步说明使用 aria-live 播报当前步骤',
  /class="step-panel" aria-live="polite"/.test(html['stitches.html']));
check('a11y', '所有按钮为真实 button 元素或带 role',
  htmlFiles.every(f => !/<a[^>]*class="[^"]*ctrl-btn/.test(html[f])));
check('a11y', '筛选按钮组有 group 角色与标签',
  /role="group" aria-label="按纹样分类筛选"/.test(html['patterns.html']) &&
  /role="group" aria-label="按地区筛选作品"/.test(html['works.html']));
check('a11y', '用户文本经 HTML 转义后渲染（防注入）',
  /function esc/.test(read('js/works.js')) && /function esc/.test(read('js/patterns.js')) &&
  /&amp;/.test(read('js/works.js')));
check('a11y', '焦点样式可见（:focus-visible 轮廓）',
  /:focus-visible/.test(stylesCss));

/* ---------- D. 数据 schema 与断点恢复 ---------- */
const stitches = JSON.parse(read('data/stitches.json'));
check('data', 'stitches.json 符合 schema 标识',
  stitches.schema === 'miao-embroidery.stitches/v1');
check('data', '每种针法含分步 steps（≥4 步）且带图解元素',
  stitches.stitches.every(s => Array.isArray(s.diagram.steps) && s.diagram.steps.length >= 4 &&
    s.diagram.steps.every(st => st.title && st.instruction && Array.isArray(st.elements))));
check('data', '源流/纹样/作品/案例数据均可解析且 schema 正确',
  JSON.parse(read('data/origin.json')).schema === 'miao-embroidery.origin/v1' &&
  JSON.parse(read('data/patterns.json')).schema === 'miao-embroidery.patterns/v1' &&
  JSON.parse(read('data/works.json')).schema === 'miao-embroidery.works/v1' &&
  JSON.parse(read('data/contemporary.json')).schema === 'miao-embroidery.contemporary/v1');
check('player', '播放器状态写入 localStorage（断点恢复）',
  /mx\.stitchPlayer/.test(playerJs) && /localStorage\.setItem/.test(playerJs));
check('player', '提供“继续观看 / 从头开始”恢复横幅',
  /id="resumeBanner"/.test(html['stitches.html']) && /id="btnResume"/.test(html['stitches.html']));
check('player', '切后台与离开页面时保存进度',
  /visibilitychange/.test(playerJs) && /pagehide/.test(playerJs));
check('player', '支持上一步/下一步/播放/重置控件',
  ['btnPrev', 'btnNext', 'btnPlay', 'btnReset'].every(id => html['stitches.html'].includes(id)));

/* ---------- 汇总输出 ---------- */
const groups = {};
for (const r of results) {
  groups[r.group] = groups[r.group] || { pass: 0, fail: 0 };
  groups[r.group].pass += r.pass ? 1 : 0;
  groups[r.group].fail += r.pass ? 0 : 1;
}
const failed = results.filter(r => !r.pass);
const payload = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  groups,
  results
};
fs.writeFileSync(path.join(REPORTS, 'a11y-check.json'), JSON.stringify(payload, null, 2) + '\n');

console.log('──────────────────────────────────────');
console.log(' 自动化检查 · 移动端焦点 / 动画减弱 / 无障碍');
console.log('──────────────────────────────────────');
Object.keys(groups).forEach(g => {
  console.log(' ' + g.padEnd(8) + ' ✓ ' + groups[g].pass + '  ✗ ' + groups[g].fail);
});
console.log('──────────────────────────────────────');
console.log(' 合计 ' + payload.total + ' 项，通过 ' + payload.passed + '，失败 ' + payload.failed);
if (failed.length) {
  failed.forEach(f => console.log('   ✗ [' + f.group + '] ' + f.name));
}
console.log(' 报告：reports/a11y-check.json');
process.exitCode = failed.length ? 1 : 0;
