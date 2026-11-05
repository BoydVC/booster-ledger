// Static server for src/ only. Never reads anything outside src/; data comes from the committed public snapshot.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve('src'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
http.createServer((q, r) => {
  const p = path.resolve(root, '.' + decodeURIComponent(new URL(q.url, 'http://x').pathname.replace(/\/$/, '/index.html')));
  if (!p.startsWith(root + path.sep)) { r.writeHead(403); return r.end(); }
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[path.extname(p)] || 'text/plain' }); r.end(d); });
}).listen(process.env.PORT || 4477, () => console.log('booster-ledger on', process.env.PORT || 4477));
