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

export function createCaseShortcut(scroller, content) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'quick-home';
  button.title = 'Наверх';
  button.setAttribute('aria-label', 'Наверх');
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↑';
  button.append(arrow);
  setupQuickHome(button, scroller);

  const update = () => button.style.setProperty('--page-progress', `${scrollFraction(scroller) * 100}%`);
  const scrollTarget = scroller === document.scrollingElement ? document : scroller;
  scrollTarget.addEventListener('scroll', update, { passive: true });
  const observer = new ResizeObserver(update);
  observer.observe(scroller);
  observer.observe(content);
  update();
  return button;
}
