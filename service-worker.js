const CACHE='professor-control-offline-v3-6-alunos-ativos-20260820';
const LOCAL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./runtime-v23.js','./attendance-pdf-fix.js','./frequency-school.js','./activities-school.js','./activities-quick-mark.js','./notes-school.js','./notes-active-filter.js','./horarios.js','./home-schedule-call.js','./siap-integracao.js','./session-fix.js','./home-actions.js','./advertencias.js','./school-filter-fix.js','./backup-migration.js','./planning-execute.js','./update-app.js','./atualizar.html','./parts/part00.txt','./parts/part01.txt','./parts/part02.txt','./parts/part03.txt','./parts/part04.txt','./parts/part05.txt','./parts/part06.txt','./parts/part07.txt','./parts/part08.txt','./parts/part09.txt','./parts/part10.txt','./parts/part11.txt'];
const REMOTE=['https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs'];
async function prepare(){const c=await caches.open(CACHE);await c.addAll(LOCAL);for(const u of REMOTE){try{const r=await fetch(new Request(u,{mode:'cors',credentials:'omit',cache:'no-store'}));if(r.ok)await c.put(u,r.clone())}catch(e){}}}
self.addEventListener('install',e=>{e.waitUntil(prepare());self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data?.type==='PREPARE_OFFLINE')e.waitUntil(prepare())});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{const r=await fetch(e.request,{cache:'no-store'});const c=await caches.open(CACHE);c.put('./index.html',r.clone()).catch(()=>{});c.put('./',r.clone()).catch(()=>{});return r}
      catch(err){return (await caches.match('./index.html'))||(await caches.match('./'))}
    })());return;
  }
  e.respondWith((async()=>{const hit=await caches.match(e.request);if(hit)return hit;const r=await fetch(e.request,{cache:'no-store'});const c=await caches.open(CACHE);c.put(e.request,r.clone()).catch(()=>{});return r})());
});