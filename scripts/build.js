#!/usr/bin/env node
/* ============================================================
   苗绣专题站 · 静态构建脚本（零依赖，仅用 Node 内置模块）
   1) 清理并复制站点到 dist/
   2) 扫描 HTML/CSS/JS 中的本地资源引用，校验断链
   3) 生成 dist/asset-manifest.json（带文件大小与哈希）
   4) 输出 reports/broken-links.json 与构建摘要
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const REPORTS = path.join(ROOT, 'reports');

const COPY_DIRS = ['css', 'js', 'data'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'reports', '.git', 'scripts']);

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function walk(dir, out) {
  out = out || [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (st.isFile()) out.push(full);
  }
  return out;
}

function toPosix(p) { return p.split(path.sep).join('/'); }

function hashFile(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/* ---------- 复制站点 ---------- */
rmrf(DIST);
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(REPORTS, { recursive: true });

const htmlSources = walk(ROOT).filter(f => f.endsWith('.html'));
for (const f of htmlSources) {
  const rel = path.relative(ROOT, f);
  const dest = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(f, dest);
}
for (const d of COPY_DIRS) {
  const src = path.join(ROOT, d);
  if (!fs.existsSync(src)) continue;
  for (const f of walk(src)) {
    const rel = path.relative(ROOT, f);
    const dest = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(f, dest);
  }
}

/* ---------- 收集断链 ---------- */
const broken = [];
const seenReferences = new Set();

function recordRef(sourceFile, rawRef, kind) {
  if (!rawRef) return;
  let ref = rawRef.trim();
  if (!ref || ref.startsWith('#')) return;
  if (/^(https?:)?\/\//i.test(ref) || ref.startsWith('mailto:') ||
      ref.startsWith('tel:') || ref.startsWith('data:')) return;

  // 去掉查询串/锚点
  ref = ref.split('#')[0].split('?')[0];
  if (!ref) return;

  const key = sourceFile + '->' + ref;
  if (seenReferences.has(key)) return;
  seenReferences.add(key);

  let baseDir = path.dirname(sourceFile);
  // JS 中的相对引用（如 fetch('data/x.json')）以站点根解析
  if (kind === 'js-fetch' && !ref.startsWith('.')) baseDir = DIST;
  if (kind === 'css-url' && !ref.startsWith('.')) baseDir = path.dirname(sourceFile);

  const target = path.normalize(path.resolve(baseDir, ref));
  if (!fs.existsSync(target)) {
    broken.push({
      source: toPosix(path.relative(DIST, sourceFile)),
      reference: rawRef,
      kind,
      resolved: toPosix(path.relative(DIST, target)),
      reason: 'ENOENT'
    });
  }
}

const HTML_REF = /(?:href|src)\s*=\s*"([^"]+)"/gi;
const CSS_URL = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
const JS_FETCH = /(?:fetch|import\()\s*\(?\s*['"]([^'"]+)['"]/gi;

function scanFile(f) {
  const text = fs.readFileSync(f, 'utf8');
  let m;
  if (f.endsWith('.html')) {
    HTML_REF.lastIndex = 0;
    while ((m = HTML_REF.exec(text))) recordRef(f, m[1], 'html');
  } else if (f.endsWith('.css')) {
    CSS_URL.lastIndex = 0;
    while ((m = CSS_URL.exec(text))) recordRef(f, m[1], 'css-url');
  } else if (f.endsWith('.js')) {
    JS_FETCH.lastIndex = 0;
    while ((m = JS_FETCH.exec(text))) recordRef(f, m[1], 'js-fetch');
  }
}

const distFiles = walk(DIST);
for (const f of distFiles) scanFile(f);

/* ---------- 生成 manifest ---------- */
const manifest = {
  name: 'miao-embroidery-site',
  version: '1.0.0',
  builtAt: new Date().toISOString(),
  fileCount: distFiles.length,
  totalBytes: 0,
  assets: distFiles.map(f => {
    const stat = fs.statSync(f);
  return {
      path: toPosix(path.relative(DIST, f)),
      bytes: stat.size,
      sha256: hashFile(f).slice(0, 16)
    };
  })
};
manifest.totalBytes = manifest.assets.reduce((s, a) => s + a.bytes, 0);
manifest.assets.sort((a, b) => a.path.localeCompare(b.path));

fs.writeFileSync(path.join(DIST, 'asset-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n');

/* ---------- 断链报告 ---------- */
const report = {
  generatedAt: new Date().toISOString(),
  scannedFiles: distFiles.map(f => toPosix(path.relative(DIST, f))).sort(),
  referencesChecked: seenReferences.size,
  brokenCount: broken.length,
  broken
};
fs.writeFileSync(path.join(REPORTS, 'broken-links.json'),
  JSON.stringify(report, null, 2) + '\n');

/* ---------- 控制台摘要 ---------- */
console.log('──────────────────────────────────────');
console.log(' 苗绣专题站 · 静态构建完成');
console.log('──────────────────────────────────────');
console.log(' 输出目录   : dist/');
console.log(' 文件数     : ' + manifest.fileCount);
console.log(' 总大小     : ' + (manifest.totalBytes / 1024).toFixed(1) + ' KB');
console.log(' 引用检查   : ' + seenReferences.size + ' 条');
console.log(' 断链       : ' + broken.length + ' 条');
if (broken.length) {
  broken.forEach(b => console.log('   ✗ [' + b.kind + '] ' + b.source + ' → ' + b.reference));
}
console.log(' manifest   : dist/asset-manifest.json');
console.log(' 断链报告   : reports/broken-links.json');

process.exitCode = broken.length ? 1 : 0;
