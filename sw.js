// Recursos locales de la interfaz; los servicios Firebase requieren Internet.
const CACHE="gincana-upec-v6";
const ASSETS=["./","./index.html","./equipo-v3.js","./firebase-core.js",
 "./firebase-config.js","./style.css","./upec.css","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener("activate",event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 if(/\/(organizacion\.html|organizacion-v3\.js|facilitador\.html|facilitador\.js)$/.test(url.pathname))return;
 event.respondWith((async()=>{
  try{
   const res=await fetch(event.request);
   if(res.ok){const cache=await caches.open(CACHE);await cache.put(event.request,res.clone());}
   return res;
  }catch(error){const cached=await caches.match(event.request,{ignoreSearch:true});if(cached)return cached;throw error;}
 })());
});
