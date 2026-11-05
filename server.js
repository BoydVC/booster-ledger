// Static server for src/ only. Never reads anything outside src/; data comes from the committed public snapshots.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('src'), T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const H = { 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'", 'referrer-policy': 'no-referrer' };
export const server = http.createServer((q, r) => {
  if (q.method !== 'GET' && q.method !== 'HEAD') { r.writeHead(405, H); return r.end(); }
  let rel;
  try { rel = decodeURIComponent(new URL(q.url, 'http://x').pathname); } catch { r.writeHead(400, H); return r.end(); }
  if (rel.includes('\0')) { r.writeHead(400, H); return r.end(); }
  const p = path.resolve(root, '.' + (rel.endsWith('/') ? rel + 'index.html' : rel));
  if (!p.startsWith(root + path.sep)) { r.writeHead(403, H); return r.end(); }
  fs.readFile(p, (e, d) => {
    if (e) { r.writeHead(404, H); return r.end(); }
    r.writeHead(200, { ...H, 'content-type': T[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-cache' }); r.end(q.method === 'HEAD' ? undefined : d);
  });
});
server.listen(process.env.PORT || 4477, '127.0.0.1', () => console.log('booster-ledger on', process.env.PORT || 4477));
