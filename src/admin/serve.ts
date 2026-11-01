import { assets } from './assets';
export function adminResponse(path:string,method:string):Response|null {
  if(method!=='GET')return null;
  const key=path==='/'||path==='/admin'||path==='/admin/'?'index.html':path==='/admin/app.js'?'app.js':path==='/admin/style.css'?'style.css':null;
  if(!key)return null;
  return new Response(assets[key],{headers:{'Content-Type':key.endsWith('.html')?'text/html; charset=utf-8':key.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob: data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
}
