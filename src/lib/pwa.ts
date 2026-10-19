/** Preview pages must never acquire a persistent app-shell worker. */
export function shouldRegisterPwa(production: boolean, hostname: string, embedded: boolean, search: string): boolean {
  const preview = hostname.startsWith('id-preview--') || hostname.startsWith('preview--') ||
    ['lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev'].some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  return production && !embedded && !preview && !new URLSearchParams(search).has('sw');
}

export async function registerPwa() {
  if (!('serviceWorker' in navigator)) return;
  if (!shouldRegisterPwa(import.meta.env.PROD, location.hostname, window.self !== window.top, location.search)) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(r => [r.active, r.waiting, r.installing].some(w => w && new URL(w.scriptURL).pathname === '/sw.js')).map(r => r.unregister()));
    return;
  }
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await registration.update();
}
