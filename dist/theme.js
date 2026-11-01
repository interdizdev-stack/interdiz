(() => {
  const requested = new URLSearchParams(location.search).get('theme');
  let theme = 'light';
  try {
    if (localStorage.getItem('interdiz-theme') === 'dark') theme = 'dark';
  } catch {}
  if (requested === 'light' || requested === 'dark') {
    theme = requested;
    try { localStorage.setItem('interdiz-theme', theme); } catch {}
  }

  const dark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  document.querySelector('#white-theme').disabled = dark;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0c0e0c' : '#ffffff';
  document.title = dark ? 'InterDIZ — чёрная версия' : 'InterDIZ — белая версия';
  if (dark) {
    const icon = document.querySelector('link[rel="icon"]');
    icon.href = icon.href.replace('%23ffffff', '%230c0e0c').replace('%23adff00', '%23c2ff43');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!dark) document.querySelector('#lime-contour-outline feMorphology')?.setAttribute('radius', '1');
    const toggle = document.querySelector('.theme-switch');
    const destination = new URL(location.href);
    destination.searchParams.set('theme', dark ? 'light' : 'dark');
    destination.hash = '';
    toggle.href = destination.pathname + destination.search;
    toggle.setAttribute('aria-label', dark ? 'Включить белую версию сайта' : 'Включить чёрную версию сайта');
    toggle.title = dark ? 'Переключить на белую версию' : 'Переключить на чёрную версию';
  });
})();
