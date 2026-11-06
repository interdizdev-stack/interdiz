const flow = document.querySelector('.crm-flow');

if (flow) {
  const { gsap } = window;
  const track = flow.querySelector('.crm-track');
  const cards = [...track.querySelectorAll('.crm-format')];
  const wire = track.querySelector('.crm-wire');
  const base = wire.querySelector('.crm-wire-base');
  const progress = wire.querySelector('.crm-wire-progress');
  const packet = wire.querySelector('.crm-packet');
  const button = flow.querySelector('.crm-run');
  const label = button.querySelector('.crm-run-label');
  const icon = button.querySelector('.crm-run-icon');
  const status = flow.querySelector('.crm-flow-status');
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const pieces = [...track.querySelectorAll('.crm-piece')];
  let points = [];
  let distances = [];
  let length = 0;
  let timeline;
  let userPaused = false;
  let visible = false;
  let viewStarted = false;
  let viewportFrame = 0;
  let layoutFrame = 0;
  let layoutWidth = 0;
  let layoutHeight = 0;
  let wasReduced;
  const reduced = () => {
    let saved = false;
    try { saved = sessionStorage.getItem('interdiz-reduced') === 'true'; } catch {}
    return reduceQuery.matches || saved || document.documentElement.classList.contains('reduced-motion');
  };

  function updateViewport() {
    viewportFrame = 0;
    const bounds = track.getBoundingClientRect();
    visible = bounds.top < innerHeight && bounds.bottom > 0;
    // Start at the screenshot's framing, rather than the first visible pixel.
    // Rearm only after a full exit, so small scroll reversals do not restart it.
    if (!visible) viewStarted = false;
    const framed = bounds.top <= innerHeight * .65 && bounds.bottom >= innerHeight * .35;
    if (visible && framed && !viewStarted && !userPaused && !reduced() && gsap && !document.hidden) {
      viewStarted = true;
      start();
    } else syncPlayback();
  }

  function queueViewport() {
    if (!viewportFrame) viewportFrame = requestAnimationFrame(updateViewport);
  }

  function select(index) {
    cards.forEach((card, i) => {
      card.classList.toggle('is-current', i === index);
      card.classList.toggle('is-complete', i < index);
    });
  }

  function complete() {
    flow.classList.remove('is-running');
    flow.classList.add('is-complete');
    cards.forEach(card => { card.classList.remove('is-current'); card.classList.add('is-complete'); });
    progress.style.strokeDashoffset = '0';
    packet.style.opacity = '0';
    gsap?.set(pieces, { clearProps: 'transform,opacity' });
    label.textContent = 'Повторить цепочку';
    icon.textContent = '↻';
    status.textContent = 'Все четыре модуля связаны в одну цепочку';
  }

  function measure() {
    layoutFrame = 0;
    const bounds = track.getBoundingClientRect();
    if (bounds.width === layoutWidth && bounds.height === layoutHeight) return;
    layoutWidth = bounds.width;
    layoutHeight = bounds.height;
    points = cards.map(card => {
      const port = card.querySelector('.crm-port').getBoundingClientRect();
      return { x: port.left + port.width / 2 - bounds.left, y: port.top + port.height / 2 - bounds.top };
    });
    length = 0;
    distances = points.map((point, index) => {
      if (index) length += Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y);
      return length;
    });
    const path = points.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ');
    base.setAttribute('d', path);
    progress.setAttribute('d', path);
    progress.style.strokeDasharray = String(length);
    progress.style.strokeDashoffset = flow.classList.contains('is-complete') ? '0' : String(length);
    if (timeline) { timeline.kill(); timeline = null; complete(); }
  }

  function syncPlayback() {
    if (!timeline?.isActive() && !timeline?.paused()) return;
    const paused = userPaused || !visible || document.hidden;
    timeline.paused(paused);
    flow.classList.toggle('is-running', !paused);
    label.textContent = userPaused ? 'Продолжить цепочку' : 'Приостановить';
    icon.textContent = userPaused ? '▶' : 'Ⅱ';
  }

  function start() {
    measure();
    if (!length) return;
    timeline?.kill();
    timeline = null;
    userPaused = false;
    flow.classList.remove('is-complete');
    if (reduced() || !gsap) { complete(); return; }
    select(-1);
    flow.classList.add('is-running');
    status.textContent = 'Данные проходят четыре модуля';
    label.textContent = 'Приостановить';
    icon.textContent = 'Ⅱ';
    gsap.set(pieces, { clearProps: 'transform,opacity' });
    cards.forEach(card => {
      seen.delete(card);
      const bounds = card.getBoundingClientRect();
      if (bounds.top < innerHeight && bounds.bottom > 0) revealCard(card);
    });
    gsap.set(packet, { attr: { cx: points[0].x, cy: points[0].y }, opacity: 1 });
    progress.style.strokeDashoffset = String(length);
    timeline = gsap.timeline({ onComplete: complete });
    cards.forEach((card, index) => {
      if (index) {
        timeline.to(packet, { attr: { cx: points[index].x, cy: points[index].y }, duration: .48, ease: 'power2.inOut' });
        timeline.to(progress, { strokeDashoffset: length - distances[index], duration: .48, ease: 'power2.inOut' }, '<');
      }
      timeline.call(() => select(index));
      timeline.fromTo(card.querySelectorAll('.crm-piece'), {
        x: (_, piece) => Number(piece.dataset.x || 0),
        y: (_, piece) => Number(piece.dataset.y || 0),
        rotation: (_, piece) => Number(piece.dataset.rotate || 0),
        opacity: .35, transformOrigin: '50% 50%'
      }, { x: 0, y: 0, rotation: 0, opacity: 1, duration: .65, stagger: .08, ease: 'power3.out' });
    });
    timeline.to(packet, { opacity: 0, duration: .2 });
    syncPlayback();
  }

  function syncMotion() {
    const nextReduced = reduced();
    if (nextReduced === wasReduced) return;
    wasReduced = nextReduced;
    if (nextReduced) {
      const hadSequence = Boolean(timeline);
      timeline?.kill(); timeline = null;
      gsap?.killTweensOf(track.querySelectorAll('.crm-visual'));
      gsap?.set(track.querySelectorAll('.crm-visual'), { clearProps: 'transform,opacity' });
      if (hadSequence) complete();
    }
  }

  button.addEventListener('click', () => {
    viewStarted = true;
    if (timeline && timeline.progress() < 1) { userPaused = !userPaused; syncPlayback(); }
    else start();
  });
  const seen = new WeakSet();
  function revealCard(card) {
    if (seen.has(card) || !gsap || reduced()) return;
    seen.add(card);
    gsap.fromTo(card.querySelector('.crm-visual'), { y: 26, opacity: .25 }, {
      y: 0, opacity: 1, duration: .8, ease: 'power3.out',
      clearProps: 'transform,opacity', overwrite: true
    });
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) seen.delete(entry.target);
      else if (viewStarted) revealCard(entry.target);
    }
  }, { threshold: .15 });
  cards.forEach(card => observer.observe(card));
  const resize = new ResizeObserver(() => {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(() => { measure(); updateViewport(); });
  });
  resize.observe(track);
  const rootObserver = new MutationObserver(syncMotion);
  rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  reduceQuery.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', updateViewport);
  addEventListener('scroll', queueViewport, { passive: true });
  addEventListener('resize', queueViewport, { passive: true });
  addEventListener('pageshow', () => { measure(); syncMotion(); updateViewport(); });
  document.fonts.ready.then(() => { measure(); updateViewport(); });
  measure();
  syncMotion();
  updateViewport();
  button.hidden = false;
}
