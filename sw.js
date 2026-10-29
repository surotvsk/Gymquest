/* Replaces the old GymQuest service worker at /Gymquest/ (the app moved to /Gym-Lift/).
   Takes over at once, sends every open window to the same place under /Gym-Lift/, then removes itself.
   It deletes NO caches or data: they belong to the same site and are still used by the app at /Gym-Lift/. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      try {
        const u = new URL(c.url);
        const i = u.pathname.toLowerCase().indexOf('/gymquest/');
        const rest = i >= 0 ? u.pathname.slice(i + '/gymquest/'.length) : '';
        await c.navigate('/Gym-Lift/' + rest + u.search + u.hash);
      } catch (e) { /* okno, ktoré sa nedá presmerovať, presmeruje stránka index.html */ }
    }
    await self.registration.unregister();
  })());
});
/* Žiadny fetch handler: všetko ide na sieť, kde stránky presmerujú na /Gym-Lift/. */
