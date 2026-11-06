// Compatibility for bookmarks made before the site became dark-only.
// The theme, browser color and favicon are already defined in static HTML.
(() => {
  try { localStorage.removeItem('interdiz-theme'); } catch {}
  const url = new URL(location.href);
  if (!url.searchParams.has('theme')) return;
  url.searchParams.delete('theme');
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
})();
