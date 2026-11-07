const workbench = document.querySelector('.ai-workbench');

if (workbench) {
  const map = workbench.querySelector('.ai-map');
  const scenarios = [...workbench.querySelectorAll('[data-scenario]')];
  const nodes = [...workbench.querySelectorAll('[data-node]')];
  const routes = [...workbench.querySelectorAll('[data-route]')];
  const caption = map.querySelector('.ai-map-caption strong');
  const count = map.querySelector('.ai-map-count');
  const toggle = map.querySelector('.ai-motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const captions = ['ответами клиентам.', 'понятной заявкой.', 'помощью команде.', 'действиями в сервисах.'];
  let active = -1;
  let frame = 0;
  let inView = false;
  let paused = false;

  function select(index) {
    if (active === index) return;
    active = index;
    scenarios.forEach((item, i) => item.classList.toggle('is-active', i === index));
    routes.forEach((item, i) => item.classList.toggle('is-active', i === index));
    nodes.forEach((item, i) => {
      item.classList.toggle('is-active', i === index);
      if (i === index) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    caption.textContent = captions[index];
    count.firstChild.textContent = `0${index + 1}`;
  }

  function update() {
    frame = 0;
    // Use the same reading position as native fragment links and scrollIntoView.
    const target = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    let nearest = 0;
    let distance = Infinity;
    scenarios.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const delta = Math.abs(rect.top - target);
      if (delta < distance) { nearest = index; distance = delta; }
    });
    select(nearest);
  }

  function queueUpdate() {
    if (inView && !frame) frame = requestAnimationFrame(update);
  }

  function syncMotion() {
    const stopped = reduced.matches || document.documentElement.classList.contains('reduced-motion');
    map.classList.toggle('is-paused', paused || stopped || document.hidden);
    toggle.hidden = stopped;
  }

  nodes.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(index);
      // Keep browser back navigation and the no-JavaScript anchor destination.
      history.pushState(null, '', link.hash);
      scenarios[index].scrollIntoView({ behavior: 'instant', block: 'start' });
      scenarios[index].focus({ preventScroll: true });
    });
  });

  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Возобновить анимацию схемы' : 'Приостановить анимацию схемы');
    toggle.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
    syncMotion();
  });

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target === workbench) { inView = entry.isIntersecting; queueUpdate(); }
      else map.classList.toggle('is-visible', entry.isIntersecting);
    }
  });
  observer.observe(workbench);
  observer.observe(map);
  const motionObserver = new MutationObserver(syncMotion);
  motionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  addEventListener('scroll', queueUpdate, { passive: true });
  addEventListener('resize', queueUpdate, { passive: true });
  addEventListener('pageshow', () => { syncMotion(); queueUpdate(); });
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  select(0);
  syncMotion();
}
