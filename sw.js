const CACHE='topik-study-shell-v9';
const QUESTION_IMAGES=['35','36','37','41','47','52','60','64','83','91','96','102'].flatMap(exam=>[5,6,7,8,9,10].map(number=>`./assets/questions/${exam}/q${String(number).padStart(2,'0')}.png`));
const LISTENING_IMAGES=['35','36','37','41','47','52','60','64','83','91','96','102'].flatMap(exam=>[1,2,3].flatMap(number=>['a','b','c','d'].map(letter=>`./assets/questions-listening/${exam}/q${String(number).padStart(2,'0')}-${letter}.png`)));
const CORE=['./','./index.html','./manifest.webmanifest','./assets/icon.svg','./assets/css/app.css?v=20260702-1','./assets/js/vocab-batch1.js?v=20260702-1','./assets/js/vocab-4000.js?v=20260702-1','./assets/js/grammar-400.js?v=20260702-1','./assets/js/topik-reading-bank.js?v=20260702-1','./assets/js/topik-listening-bank.js?v=20260702-1','./assets/js/data.js?v=20260702-1','./assets/js/storage.js?v=20260702-1','./assets/js/app.js?v=20260702-1',...QUESTION_IMAGES,...LISTENING_IMAGES];

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/resources/past-papers/'))return;
  if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html')));return}
  event.respondWith(caches.match(request).then(cached=>{const update=fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response}).catch(()=>cached);return cached||update}));
});
