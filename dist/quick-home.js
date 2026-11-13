export function scrollFraction(scroller, position = scroller.scrollTop) {
  const range = scroller.scrollHeight - scroller.clientHeight;
  return range > 0 ? Math.max(0, Math.min(1, position / range)) : 0;
}

function reducedMotion() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduced-motion')) return true;
  try { return sessionStorage.getItem('interdiz-reduced') === 'true'; } catch { return false; }
}

export function setupQuickHome(control, scroller) {
  control.addEventListener('click', () => {
    const reduced = reducedMotion();
    if (!reduced) control.classList.add('is-launching');
    scroller?.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  });
  const finishFlight = event => {
    if (event.animationName === 'quick-home-flight') control.classList.remove('is-launching');
  };
  control.addEventListener('animationend', finishFlight);
  control.addEventListener('animationcancel', finishFlight);
}
