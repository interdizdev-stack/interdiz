// Run in the head, before the home page can paint at the start of the hero.
(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  let returnTarget = null;
  try {
    if (navigation?.type === 'back_forward') {
      returnTarget = sessionStorage.getItem('interdiz-home-return');
      if (!returnTarget && sessionStorage.getItem('interdiz-services-return') === 'true') returnTarget = 'services';
    }
    sessionStorage.removeItem('interdiz-home-return');
    sessionStorage.removeItem('interdiz-services-return');
  } catch {}
  const hashTarget = ({ '#services': 'services', '#solutions-track': 'services', '#projects': 'projects' })[location.hash];
  const targetId = (['services', 'projects'].includes(returnTarget) ? returnTarget : null) || hashTarget;
  if (!targetId) return;
  // Own the initial position: native fragment scrolling can also scroll clipped
  // containers while the pinned layout is being created before window.load.
  const destination = `${location.pathname}${location.search}#${targetId}`;
  history.replaceState(history.state, '', `${location.pathname}${location.search}`);
  history.scrollRestoration = 'manual';

  const root = document.documentElement;
  root.classList.add('home-entry-pending');
  let pending = true;
  let finishing;
  let failing = false;

  function reveal() {
    pending = false;
    history.replaceState(history.state, '', destination);
    root.classList.remove('home-entry-pending');
    removeEventListener('error', onError, true);
    removeEventListener('unhandledrejection', fallback);
  }

  async function fallback() {
    if (!pending || failing) return;
    failing = true;
    if (document.readyState === 'loading') await new Promise(resolve => addEventListener('DOMContentLoaded', resolve, { once: true }));
    await document.fonts.ready;
    if (!pending) return;
    document.getElementById(targetId)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    reveal();
  }

  function onError(event) {
    if (event.error || event.target?.matches?.('script[type="module"]')) fallback();
  }

  window.interdizHomeEntry = {
    targetId,
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
