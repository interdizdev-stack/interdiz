// Prepare the pinned layout before showing the home page, including on reload.
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
  const restoreScroll = navigation?.type === 'reload';
  const scrollKey = 'interdiz-home-scroll';
  let savedScroll = null;
  try {
    if (restoreScroll) {
      const saved = JSON.parse(sessionStorage.getItem(scrollKey));
      const url = `${location.pathname}${location.search}${location.hash}`;
      if (saved?.url === url && Number.isFinite(saved.top)) savedScroll = saved.top;
    } else sessionStorage.removeItem(scrollKey);
  } catch {}
  const hashTarget = restoreScroll ? null : ({ '#services': 'services', '#solutions-track': 'services', '#projects': 'projects' })[location.hash];
  const targetId = (['services', 'projects'].includes(returnTarget) ? returnTarget : null) || hashTarget || null;
  // Own the initial position: native fragment scrolling can also scroll clipped
  // containers while the pinned layout is being created before window.load.
  const destination = targetId ? `${location.pathname}${location.search}#${targetId}` : null;
  if (targetId) history.replaceState(history.state, '', `${location.pathname}${location.search}`);
  history.scrollRestoration = targetId || savedScroll !== null ? 'manual' : 'auto';

  const root = document.documentElement;
  root.classList.add('home-entry-pending');
  let pending = true;
  let finishing;
  let failing = false;

  function reveal() {
    pending = false;
    if (destination) history.replaceState(history.state, '', destination);
    history.scrollRestoration = 'auto';
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
    if (targetId) document.getElementById(targetId)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    else if (savedScroll !== null) scrollTo({ top: savedScroll, behavior: 'instant' });
    reveal();
  }

  function onError(event) {
    if (event.error || event.target?.matches?.('script[type="module"]')) fallback();
  }

  window.interdizHomeEntry = {
    targetId,
    restoreScroll,
    scrollTop: savedScroll,
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
  // Keep the unclamped position before an unpinned loading document can shorten it.
  addEventListener('pagehide', () => {
    if (pending) return;
    const top = window.ScrollSmoother?.get()?.scrollTop() ?? scrollY;
    try {
      sessionStorage.setItem(scrollKey, JSON.stringify({
        url: `${location.pathname}${location.search}${location.hash}`, top
      }));
    } catch {}
  });
})();
