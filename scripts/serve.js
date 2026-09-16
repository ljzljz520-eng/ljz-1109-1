#!/usr/bin/env node
/* 零依赖静态服务器：优先服务 dist/（构建产物），不存在则服务源码根目录 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BASE = fs.existsSync(path.join(DIST, 'index.html')) ? DIST : ROOT;
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(BASE, urlPath);
  if (!filePath.startsWith(BASE)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found: ' + urlPath);
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('苗绣专题站已启动：');
  console.log('  本地访问  http://localhost:' + PORT + '/');
  console.log('  服务目录  ' + path.relative(ROOT, BASE) || '.');
  console.log('  按 Ctrl+C 停止');
});
