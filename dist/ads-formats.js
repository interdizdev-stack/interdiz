const posters = [...document.querySelectorAll('.ads-format')];

if (posters.length) {
  const { gsap } = window;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const timelines = new Map();
  const entered = new WeakSet();
  const visible = new Set();
  const reduced = () => {
    let saved = false;
    try { saved = sessionStorage.getItem('interdiz-reduced') === 'true'; } catch {}
    return preference.matches || saved || document.documentElement.classList.contains('reduced-motion');
  };

  function finish(card) {
    const timeline = timelines.get(card);
    if (timeline) { timeline.progress(1); timeline.kill(); timelines.delete(card); }
    card.classList.remove('is-animating');
  }

  function animate(card) {
    if (!gsap || reduced()) return;
    finish(card);
    entered.add(card);
    const find = selector => card.querySelectorAll(selector);
    card.classList.add('is-animating');
    const tl = gsap.timeline({
      defaults: { duration: .8, ease: 'power3.out' },
      onComplete: () => { card.classList.remove('is-animating'); timelines.delete(card); }
    });
    timelines.set(card, tl);
    const gather = (selector, at = 0) => tl.fromTo(find(selector), {
      x: (_, el) => Number(el.dataset.x || 0), y: (_, el) => Number(el.dataset.y || 0),
      rotation: (_, el) => Number(el.dataset.turn || 0), opacity: .3, transformOrigin: '50% 50%'
    }, { x: 0, y: 0, rotation: 0, opacity: 1, stagger: .12, clearProps: 'transform,opacity', ease: 'back.out(1.1)' }, at);

    if (card.dataset.adsScene === 'audience') {
      tl.fromTo(find('.ads-focus-frame'), { scale: 1.2, opacity: .15, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, clearProps: 'transform,opacity' }, 0);
      gather('.ads-keyword', .12);
      tl.fromTo(find('.ads-focus-arrow'), { x: 32, y: -32, opacity: 0 }, { x: 0, y: 0, opacity: 1, clearProps: 'transform,opacity' }, .3);
      tl.fromTo(find('.ads-focus-scan'), { y: -72, opacity: 0 }, { y: 72, opacity: .45, duration: 1.2, ease: 'power1.inOut' }, .45)
        .to(find('.ads-focus-scan'), { opacity: 0, duration: .25, clearProps: 'transform,opacity' });
    } else if (card.dataset.adsScene === 'campaigns') {
      gather('.ads-ad-sheet');
      tl.fromTo(find('.ads-ad-cursor'), { x: 45, y: 35, scale: 1.2, opacity: 0, transformOrigin: '15% 15%' }, { x: 0, y: 0, scale: 1, opacity: 1 }, .55)
        .to(find('.ads-ad-cursor'), { scale: .86, duration: .15 }, 1.25)
        .to(find('.ads-ad-cursor'), { scale: 1, duration: .3, clearProps: 'transform,opacity' });
      tl.fromTo(find('.ads-click-ripple'), { scale: .2, opacity: .8, transformOrigin: '50% 50%' }, { scale: 1.8, opacity: 0, duration: .65, clearProps: 'transform,opacity' }, 1.35);
    } else if (card.dataset.adsScene === 'measurement') {
      gather('.ads-event');
      tl.fromTo(find('.ads-trace'), {
        strokeDasharray: (_, el) => el.getTotalLength(), strokeDashoffset: (_, el) => el.getTotalLength()
      }, { strokeDashoffset: 0, stagger: .15, duration: 1, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' }, .3);
      tl.fromTo(find('.ads-goal'), { scale: .7, opacity: .15, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, ease: 'back.out(1.8)', clearProps: 'transform,opacity' }, .85);
      tl.fromTo(find('.ads-event-dot'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .4, ease: 'back.out(2)', clearProps: 'transform' }, .7);
    } else {
      gather('.ads-fader');
      tl.fromTo(find('.ads-budget-bar'), { scaleY: .15, transformOrigin: '50% 100%' }, { scaleY: 1, stagger: .15, duration: 1.1, clearProps: 'transform' }, .3);
      tl.fromTo(find('.ads-cycle'), { rotation: -120, scale: .8, transformOrigin: '50% 50%' }, { rotation: 0, scale: 1, duration: 1.4, clearProps: 'transform' }, .2);
    }
    if (document.hidden) tl.pause();
  }

  function syncMotion() {
    const stop = reduced() || !gsap;
    posters.forEach(card => {
      card.querySelector('.ads-replay').hidden = stop;
      if (stop) {
        finish(card);
        card.style.removeProperty('--ads-tilt-x');
        card.style.removeProperty('--ads-tilt-y');
      }
    });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const card = entry.target.closest('.ads-format');
      if (!entry.isIntersecting) {
        visible.delete(card);
        entered.delete(card);
        finish(card);
      } else {
        visible.add(card);
        if (entry.intersectionRatio >= .35 && !entered.has(card)) animate(card);
      }
    });
  }, { threshold: [0, .35] });

  posters.forEach(card => {
    const visual = card.querySelector('.ads-visual');
    observer.observe(visual);
    card.querySelector('.ads-replay').addEventListener('click', () => animate(card));
    visual.addEventListener('pointermove', event => {
      if (!pointer.matches || reduced()) return;
      const box = visual.getBoundingClientRect();
      card.style.setProperty('--ads-tilt-x', `${-((event.clientY - box.top) / box.height - .5) * 7}deg`);
      card.style.setProperty('--ads-tilt-y', `${((event.clientX - box.left) / box.width - .5) * 9}deg`);
    });
    visual.addEventListener('pointerleave', () => {
      card.style.removeProperty('--ads-tilt-x');
      card.style.removeProperty('--ads-tilt-y');
    });
  });
  document.addEventListener('visibilitychange', () => {
    timelines.forEach((tl, card) => tl.paused(document.hidden || !visible.has(card)));
  });
  const rootObserver = new MutationObserver(syncMotion);
  rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  preference.addEventListener('change', syncMotion);
  addEventListener('pageshow', syncMotion);
  syncMotion();
}
