'use strict';
// Local dev server: serves index.html + assets and handles POST /api/contact.  Run: npm start
const http = require('http');
const fs = require('fs');
const path = require('path');
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch {}
const contact = require('./api/contact');

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/api/contact') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => { req.body = raw; contact(req, res); });
    return;
  }
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const file = path.join(__dirname, rel);
  if (!file.startsWith(path.join(__dirname, 'assets')) && rel !== 'index.html') { res.statusCode = 404; return res.end('Not found'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', types[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000)));
