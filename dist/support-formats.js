const desk = document.querySelector('.support-desk');

if (desk) {
  const rack = desk.querySelector('.support-rack');
  const drawers = [...desk.querySelectorAll('.support-drawer')];
  const summaries = drawers.map(drawer => drawer.querySelector('summary'));
  const bodies = drawers.map(drawer => drawer.querySelector('.support-body'));
  const visuals = drawers.map(drawer => drawer.querySelector('.support-visual'));
  const replays = drawers.map(drawer => drawer.querySelector('.support-replay'));
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set();
  let active = 0;
  let pendingArt = 0;
  let bodyHeight = 0;
  let transition;
  let illustration;
  let lastWidth = 0;
  let resizeFrame;

  function reduced() {
    let saved = false;
    try { saved = sessionStorage.getItem('interdiz-reduced') === 'true'; } catch {}
    return preference.matches || saved || document.documentElement.classList.contains('reduced-motion');
  }

  function stopArt() {
    illustration?.revert();
    illustration = null;
  }

  // Each illustration assembles once on reveal. The reader can replay it explicitly.
  function playArt() {
    stopArt();
    pendingArt = -1;
    if (active < 0 || reduced() || !window.gsap || document.hidden) return;
    const art = visuals[active].querySelector('.support-art');
    illustration = window.gsap.context(() => {
      const timeline = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline.from(art.querySelectorAll('.support-piece'), {
        x: (_, element) => Number(element.dataset.shift || 0),
        y: (_, element) => Number(element.dataset.lift || 0),
        opacity: 0, duration: .9, stagger: .12, clearProps: 'transform,opacity'
      }, 0);
      timeline.fromTo(art.querySelector('.support-trace'), {
        strokeDasharray: 1, strokeDashoffset: 1
      }, {
        strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut',
        clearProps: 'strokeDasharray,strokeDashoffset'
      }, .25);
      timeline.from(art.querySelector('.support-stamp'), {
        scale: .45, opacity: 0, transformOrigin: 'center', duration: .55,
        ease: 'back.out(1.5)', clearProps: 'transform,transformOrigin,opacity'
      }, .8);
      const sweep = art.querySelector('.support-sweep');
      if (sweep) {
        timeline.fromTo(sweep, { x: 0, opacity: 0 }, { opacity: 1, duration: .15 }, .25)
          .to(sweep, { x: 270, duration: 1.2, ease: 'power1.inOut' }, .3)
          .to(sweep, { opacity: 0, duration: .2 }, 1.35);
      }
    }, art);
  }

  function updateState() {
    drawers.forEach((drawer, index) => {
      const selected = index === active;
      drawer.classList.toggle('is-active', selected);
      summaries[index].setAttribute('aria-expanded', String(selected));
      bodies[index].setAttribute('aria-hidden', String(!selected));
      bodies[index].inert = !selected;
    });
  }

  function settle() {
    transition?.kill();
    transition = null;
    drawers.forEach((drawer, index) => {
      drawer.open = index === active;
      bodies[index].style.removeProperty('height');
    });
    updateState();
  }

  function refreshLayout(previousHeight) {
    if (Math.abs(rack.getBoundingClientRect().height - previousHeight) > 1) {
      requestAnimationFrame(() => window.ScrollTrigger?.refresh());
    }
  }

  // Reserve the tallest panel so switching services doesn't move the next section.
  // Measure outside closed details; their descendants have no rendered dimensions.
  function measure() {
    const previousHeight = rack.getBoundingClientRect().height;
    settle();
    const heights = bodies.map((body, index) => {
      const clone = body.cloneNode(true);
      clone.classList.add('support-measure');
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      clone.inert = true;
      clone.setAttribute('aria-hidden', 'true');
      clone.style.width = `${drawers[index].clientWidth}px`;
      drawers[index].parentElement.append(clone);
      const height = clone.getBoundingClientRect().height;
      clone.remove();
      return height;
    });
    bodyHeight = Math.ceil(Math.max(...heights));
    rack.style.setProperty('--support-body-height', `${bodyHeight}px`);
    lastWidth = rack.clientWidth;
    refreshLayout(previousHeight);
  }

  function select(index) {
    const previousHeight = rack.getBoundingClientRect().height;
    const heights = bodies.map((body, i) => drawers[i].open ? body.getBoundingClientRect().height : 0);
    transition?.kill();
    stopArt();
    active = index === active ? -1 : index;
    pendingArt = active;
    updateState();
    if (reduced() || !window.gsap) {
      settle();
      refreshLayout(previousHeight);
      return;
    }
    transition = window.gsap.timeline({
      onComplete: () => {
        settle();
        refreshLayout(previousHeight);
        if (active >= 0 && visible.has(visuals[active]) && pendingArt === active) playArt();
      }
    });
    drawers.forEach((drawer, i) => {
      if (heights[i] === 0 && i !== active) return;
      drawer.open = true;
      transition.fromTo(bodies[i], { height: heights[i] }, {
        height: i === active ? bodyHeight : 0, duration: .65, ease: 'power3.inOut'
      }, 0);
    });
  }

  summaries.forEach((summary, index) => {
    summary.setAttribute('aria-controls', bodies[index].id);
    summary.addEventListener('click', event => { event.preventDefault(); select(index); });
    summary.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % summaries.length;
      if (event.key === 'ArrowUp') next = (index + summaries.length - 1) % summaries.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = summaries.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      summaries[next].focus();
    });
    replays[index].addEventListener('click', playArt);
  });
  desk.classList.add('is-enhanced');

  function syncPreference() {
    stopArt();
    replays.forEach(button => { button.hidden = reduced() || !window.gsap; });
    measure();
  }

  syncPreference();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else {
        visible.delete(entry.target);
        if (entry.target === visuals[active]) stopArt();
      }
    });
    if (active >= 0 && pendingArt === active && visible.has(visuals[active]) && !transition) playArt();
  }, { threshold: .15 });
  visuals.forEach(visual => observer.observe(visual));

  const resize = new ResizeObserver(() => {
    if (Math.abs(rack.clientWidth - lastWidth) < 1) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(measure);
  });
  resize.observe(rack);
  document.fonts.ready.then(measure);
  preference.addEventListener('change', syncPreference);
  let wasReduced = reduced();
  new MutationObserver(() => {
    const nowReduced = reduced();
    if (nowReduced === wasReduced) return;
    wasReduced = nowReduced;
    syncPreference();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopArt(); });
  window.addEventListener('pagehide', () => { stopArt(); settle(); });
  window.addEventListener('pageshow', event => { if (event.persisted) syncPreference(); });
}
