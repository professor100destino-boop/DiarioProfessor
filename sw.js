const CACHE='professor-control-offline-v2';
const LOCAL_ASSETS=["./", "./index.html", "./manifest.webmanifest", "./offline-ready.json", "./icon-192.png", "./icon-512.png", "./parts/part00.txt", "./parts/part01.txt", "./parts/part02.txt", "./parts/part03.txt", "./parts/part04.txt", "./parts/part05.txt", "./parts/part06.txt", "./parts/part07.txt", "./parts/part08.txt", "./parts/part09.txt", "./parts/part10.txt"];
const REMOTE_LIBS=[
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs"
];
async function cacheCore(){const cache=await caches.open(CACHE);await cache.addAll(LOCAL_ASSETS);for(const url of REMOTE_LIBS){const req=new Request(url,{mode:'cors',credentials:'omit'});const resp=await fetch(req);if(!resp.ok)throw new Error('Falha ao armazenar '+url);await cache.put(req,resp.clone())}}
self.addEventListener('install',e=>{e.waitUntil(cacheCore());self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data?.type==='PREPARE_OFFLINE'){e.waitUntil(cacheCore().then(async()=>{for(const c of await self.clients.matchAll({includeUncontrolled:true}))c.postMessage({type:'OFFLINE_READY'})}).catch(async()=>{for(const c of await self.clients.matchAll({includeUncontrolled:true}))c.postMessage({type:'OFFLINE_ERROR'})}))}});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{const c=await caches.match(e.request);if(c)return c;try{const r=await fetch(e.request);const cache=await caches.open(CACHE);cache.put(e.request,r.clone()).catch(()=>{});return r}catch(err){if(e.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();throw err}})())});
