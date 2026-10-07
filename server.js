const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const TYPES = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const safe = v => String(v || '').replace(/[\\\n\r]/g, ' ').replace(/</g, '\\u003c');

const CATALOG_TTL_MS = Math.max(5000, Number(process.env.CATALOG_CACHE_SECONDS || 45) * 1000);
let catalogCache = { at: 0, body: null };

async function getCatalog(force = false) {
  const token = String(process.env.TEBEX_PUBLIC_TOKEN || '').trim();
  if (!token) throw Object.assign(new Error('TEBEX_PUBLIC_TOKEN is not configured'), { statusCode: 503 });
  const now = Date.now();
  if (!force && catalogCache.body && now - catalogCache.at < CATALOG_TTL_MS) return { ...catalogCache.body, cached: true };
  try {
    const upstream = await fetch(`https://headless.tebex.io/api/accounts/${encodeURIComponent(token)}/categories?includePackages=1`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    const body = await upstream.json().catch(() => ({}));
    if (!upstream.ok) throw Object.assign(new Error(body.detail || body.message || `Tebex returned ${upstream.status}`), { statusCode: 502 });
    const result = { ok: true, data: Array.isArray(body.data) ? body.data : [], fetchedAt: new Date().toISOString(), stale: false };
    catalogCache = { at: now, body: result };
    return result;
  } catch (error) {
    if (catalogCache.body) return { ...catalogCache.body, cached: true, stale: true, warning: 'Serving the last successful Tebex catalog.' };
    throw error;
  }
}

function headers(type, cache='no-cache') {
  return {
    'Content-Type': type,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://headless.tebex.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https:"
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health') {
    res.writeHead(200, headers('application/json; charset=utf-8'));
    return res.end(JSON.stringify({ok:true, service:'wcrp-devops-store'}));
  }
  if (url.pathname === '/api/catalog' && req.method === 'GET') {
    const force = url.searchParams.get('refresh') === '1';
    return getCatalog(force).then(body => {
      res.writeHead(200, headers('application/json; charset=utf-8', 'no-store'));
      res.end(JSON.stringify(body));
    }).catch(error => {
      res.writeHead(error.statusCode || 500, headers('application/json; charset=utf-8', 'no-store'));
      res.end(JSON.stringify({ ok: false, error: error.message || 'Could not load Tebex catalog' }));
    });
  }
  if (url.pathname === '/runtime-config.js') {
    const cfg = {};
    if (process.env.TEBEX_PUBLIC_TOKEN) cfg.publicToken = safe(process.env.TEBEX_PUBLIC_TOKEN);
    if (process.env.STORE_NAME) cfg.name = safe(process.env.STORE_NAME);
    if (process.env.STORE_SUPPORT_URL) cfg.supportUrl = safe(process.env.STORE_SUPPORT_URL);
    if (process.env.STORE_HERO_TEXT) cfg.heroText = safe(process.env.STORE_HERO_TEXT);
    if (process.env.STORE_LOGO) cfg.logo = safe(process.env.STORE_LOGO);
    if (process.env.STORE_HERO_IMAGE) cfg.heroImage = safe(process.env.STORE_HERO_IMAGE);
    res.writeHead(200, headers('application/javascript; charset=utf-8'));
    return res.end(`window.STORE=Object.assign(window.STORE||{},${JSON.stringify(cfg)});`);
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, headers('text/plain; charset=utf-8')); return res.end('Not found'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, headers(TYPES[ext] || 'application/octet-stream', ext === '.html' || ext === '.js' ? 'no-cache' : 'public, max-age=86400'));
    fs.createReadStream(file).pipe(res);
  });
});
server.listen(PORT, '0.0.0.0', () => console.log(`WCRP storefront listening on port ${PORT}`));
