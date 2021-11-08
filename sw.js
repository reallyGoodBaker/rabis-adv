const VER = '0'

const ASSEST = [
  './',
  "./index.html",
  "./e.png",
]

self.addEventListener('install', e => {
    e.waitUntil(
      caches.open(VER)
      .then(cache => cache.addAll(ASSEST))
      .then(() => self.skipWaiting())
    )

    console.log(e);
})

self.addEventListener('fetch', function (e) {
    var cacheMatchPromise = caches.match(e.request).then(function (cache) {
            return cache || fetch(e.request);
        }).catch(function (err) {
            console.log(err);
            return fetch(e.request);
        })
    e.respondWith(cacheMatchPromise);
});