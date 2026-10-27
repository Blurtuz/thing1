// Scramjet 1.1 service-worker integration; see THIRD-PARTY-NOTICES.md.
importScripts('/scram/scramjet.all.js');
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();
self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    await scramjet.loadConfig();
    return scramjet.route(event) ? scramjet.fetch(event) : fetch(event.request);
  })());
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
