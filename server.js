const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const TYPES={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
function headers(type,cache='no-cache'){return {'Content-Type':type,'Cache-Control':cache,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://headless.tebex.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https:"};}
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(url.pathname==='/health'){res.writeHead(200,headers('application/json; charset=utf-8','no-store'));return res.end(JSON.stringify({ok:true,service:'wcrp-devops-store',version:'2.0.0'}));}
  if(url.pathname==='/runtime-config.js'){
    const cfg={};
    if(process.env.TEBEX_PUBLIC_TOKEN)cfg.publicToken=String(process.env.TEBEX_PUBLIC_TOKEN).trim();
    if(process.env.STORE_NAME)cfg.name=String(process.env.STORE_NAME);
    if(process.env.STORE_SUPPORT_URL)cfg.supportUrl=String(process.env.STORE_SUPPORT_URL);
    if(process.env.STORE_HERO_TEXT)cfg.heroText=String(process.env.STORE_HERO_TEXT);
    res.writeHead(200,headers('application/javascript; charset=utf-8','no-store'));
    return res.end(`window.STORE=Object.assign(window.STORE||{},${JSON.stringify(cfg).replace(/</g,'\\u003c')});`);
  }
  let rel=decodeURIComponent(url.pathname); if(rel==='/')rel='/index.html';
  const file=path.resolve(ROOT,'.'+rel);
  if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  fs.stat(file,(err,st)=>{if(err||!st.isFile()){res.writeHead(404,headers('text/plain; charset=utf-8'));return res.end('Not found');} const ext=path.extname(file).toLowerCase();res.writeHead(200,headers(TYPES[ext]||'application/octet-stream',ext==='.html'||ext==='.js'?'no-cache':'public, max-age=86400'));fs.createReadStream(file).pipe(res);});
});
server.listen(PORT,'0.0.0.0',()=>console.log(`WCRP storefront listening on port ${PORT}`));
