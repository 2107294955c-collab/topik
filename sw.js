const CACHE='topik-study-shell-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./assets/icon.svg','./assets/css/app.css?v=20260630-3','./assets/js/vocab-batch1.js?v=20260630-3','./assets/js/vocab-4000.js?v=20260630-3','./assets/js/data.js?v=20260630-3','./assets/js/storage.js?v=20260630-3','./assets/js/app.js?v=20260630-3'];

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/resources/past-papers/'))return;
  if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html')));return}
  event.respondWith(caches.match(request).then(cached=>{const update=fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response}).catch(()=>cached);return cached||update}));
});
