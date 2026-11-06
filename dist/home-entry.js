// Run in the head, before the home page can paint at the start of the hero.
(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  let returningFromService = false;
  try {
    returningFromService = navigation?.type === 'back_forward' && sessionStorage.getItem('interdiz-services-return') === 'true';
    sessionStorage.removeItem('interdiz-services-return');
  } catch {}
  if (!returningFromService && !['#services', '#solutions-track'].includes(location.hash)) return;
  // Own the initial position: native fragment scrolling can also scroll clipped
  // containers while the pinned layout is being created before window.load.
  const destination = `${location.pathname}${location.search}#services`;
  history.replaceState(history.state, '', `${location.pathname}${location.search}`);
  history.scrollRestoration = 'manual';

  const root = document.documentElement;
  root.classList.add('services-entry-pending');
  let pending = true;
  let finishing;
  let failing = false;

  function reveal() {
    pending = false;
    history.replaceState(history.state, '', destination);
    root.classList.remove('services-entry-pending');
    removeEventListener('error', onError, true);
    removeEventListener('unhandledrejection', fallback);
  }

  async function fallback() {
    if (!pending || failing) return;
    failing = true;
    if (document.readyState === 'loading') await new Promise(resolve => addEventListener('DOMContentLoaded', resolve, { once: true }));
    await document.fonts.ready;
    if (!pending) return;
    document.getElementById('services').scrollIntoView({ block: 'start', behavior: 'instant' });
    reveal();
  }

  function onError(event) {
    if (event.error || event.target?.matches?.('script[type="module"]')) fallback();
  }

  window.interdizServicesEntry = {
    get pending() { return pending; },
    finish(place) {
      if (!pending) return Promise.resolve();
      // Drain the refresh/fragment callbacks before making the destination visible.
      finishing ??= new Promise(resolve => requestAnimationFrame(() => {
        place();
        requestAnimationFrame(() => { place(); reveal(); resolve(); });
      }));
      return finishing;
    }
  };

  // Release the static page on a real initialization failure, never on a timer
  // while a slow application is still loading and can rebuild the pinned hero.
  addEventListener('error', onError, true);
  addEventListener('unhandledrejection', fallback);
})();
