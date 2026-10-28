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
    document.querySelectorAll('[data-theme-option]').forEach(option => {
      const selected = option.dataset.themeOption === theme;
      const destination = new URL(location.href);
      destination.searchParams.set('theme', option.dataset.themeOption);
      destination.hash = '';
      option.href = destination.pathname + destination.search;
      option.classList.toggle('is-active', selected);
      if (selected) option.setAttribute('aria-current', 'true');
      else option.removeAttribute('aria-current');
      option.title = option.dataset.themeOption === 'dark' ? 'Чёрная версия' : 'Белая версия';
    });
  });
})();
