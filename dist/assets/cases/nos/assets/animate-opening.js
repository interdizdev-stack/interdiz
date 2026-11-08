(() => {
  const screen = document.querySelector('[data-opening-animation]');
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { reduced ||= sessionStorage.getItem('interdiz-reduced') === 'true'; } catch {}
  if (!screen || reduced) return;
  screen.src = 'assets/opening-poster.png';
  const start = () => {
    if (screen.dataset.started) return;
    screen.dataset.started = 'true';
    screen.src = screen.dataset.openingAnimation;
  };
  if (!('IntersectionObserver' in window)) { start(); return; }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.3)) {
      start();
      observer.disconnect();
    }
  }, { threshold: 0.3 });
  observer.observe(screen);
})();
