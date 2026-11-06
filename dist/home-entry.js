// Run in the head, before the home page can paint at the start of the hero.
(() => {
  if (!['#services', '#solutions-track'].includes(location.hash)) return;
  // Old return links must not give the keyboard-focusable carousel native focus.
  if (location.hash === '#solutions-track') history.replaceState(history.state, '', `${location.pathname}${location.search}#services`);

  const root = document.documentElement;
  root.classList.add('services-entry-pending');
  let pending = true;
  let finishing;
  let fallbackTimer;

  function reveal() {
    pending = false;
    clearTimeout(fallbackTimer);
    root.classList.remove('services-entry-pending');
    removeEventListener('error', onError, true);
    removeEventListener('unhandledrejection', fallback);
  }

  function fallback() {
    if (!pending) return;
    if (!document.getElementById('services')) {
      addEventListener('DOMContentLoaded', fallback, { once: true });
      return;
    }
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

  // A missing application module must never leave the static page hidden.
  addEventListener('error', onError, true);
  addEventListener('unhandledrejection', fallback);
  fallbackTimer = setTimeout(fallback, 8000);
})();
