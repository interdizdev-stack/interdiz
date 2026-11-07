// Install in the head so the incoming curtain is present before the first paint.
(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'interdiz-page-transition';
  const classes = ['page-transition-in', 'page-transition-out', 'page-transition-reveal'];
  let timer;
  let frame;
  let phase = 0;
  let observer;
  let destination;

  function reducedMotion() {
    if (preference.matches || root.classList.contains('reduced-motion')) return true;
    try { return sessionStorage.getItem('interdiz-reduced') === 'true'; } catch { return false; }
  }

  function reset() {
    phase++;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    observer?.disconnect();
    observer = null;
    destination = null;
    root.classList.remove(...classes);
  }

  function reveal() {
    if (!root.classList.contains('page-transition-in')) return;
    if (reducedMotion()) { reset(); return; }
    // Home restores the selected service/project and its scroll position first.
    if (root.classList.contains('home-entry-pending')) {
      observer ??= new MutationObserver(reveal);
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
      return;
    }
    observer?.disconnect();
    frame = requestAnimationFrame(() => {
      if (!root.classList.contains('page-transition-in')) return;
      root.classList.add('page-transition-reveal');
      timer = setTimeout(reset, 480);
    });
  }

  function navigate() {
    if (!destination) return;
    clearTimeout(timer);
    const url = destination;
    destination = null;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ url: url.href, time: Date.now() })); } catch {}
    location.assign(url.href);
  }

  let incoming = false;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    sessionStorage.removeItem(storageKey);
    if (saved && Date.now() - saved.time < 15000) {
      const url = new URL(saved.url);
      url.searchParams.delete('theme');
      incoming = url.origin === location.origin && url.pathname === location.pathname && url.search === location.search;
    }
  } catch {}
  const navigation = performance.getEntriesByType('navigation')[0];
  if (!incoming && navigation?.type !== 'reload') {
    incoming = navigation?.type === 'back_forward' ||
      (document.referrer !== '' && new URL(document.referrer).origin === location.origin);
  }
  if (incoming && !reducedMotion()) root.classList.add('page-transition-in');

  const ready = async () => {
    const currentPhase = phase;
    await document.fonts.ready;
    if (currentPhase === phase) reveal();
  };
  if (document.readyState === 'complete') ready();
  else addEventListener('load', ready, { once: true });

  // Run after link-specific handlers have saved carousel selection or closed a dialog.
  addEventListener('click', event => {
    if (!root.classList.contains('page-transition-out') || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (event.target.closest?.('a[href]')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true });
  addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) || !/(\/|\.html)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (reducedMotion()) return;
    event.preventDefault();
    if (root.classList.contains('page-transition-out')) return;
    reset();
    destination = url;
    root.classList.add('page-transition-out');
    // CSS failures and disabled animations still allow the requested navigation.
    timer = setTimeout(navigate, 280);
  });

  addEventListener('animationend', event => {
    if (event.target !== root || event.pseudoElement !== '::before') return;
    if (event.animationName === 'page-curtain-cover') navigate();
    if (event.animationName === 'page-curtain-reveal') reset();
  });
  addEventListener('pagehide', reset);
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    reset();
    if (!reducedMotion()) { root.classList.add('page-transition-in'); return ready(); }
  });
  preference.addEventListener('change', () => {
    if (reducedMotion()) { navigate(); reset(); }
  });
})();
