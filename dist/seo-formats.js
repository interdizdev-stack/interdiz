const lab = document.querySelector('.seo-lab');

if (lab) {
  const tabs = [...lab.querySelectorAll('[role="tab"]')];
  const panels = [...lab.querySelectorAll('.seo-format')];
  const scenes = [...lab.querySelectorAll('[data-seo-scene]')];
  const subjects = ['ТЕХНИЧЕСКАЯ ОСНОВА', 'АРХИТЕКТУРА СПРОСА', 'ПОЛЕЗНОЕ СОДЕРЖАНИЕ', 'ДАННЫЕ И РЕШЕНИЯ'];
  const details = ['Находим то, что мешает поиску.', 'Каждому запросу — своё место.', 'Собираем страницу вокруг ответа.', 'Наблюдаем. Сравниваем. Уточняем.'];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 760px)');
  const tablist = lab.querySelector('.seo-tabs');
  let active = 0;
  let animation;
  let seen = false;
  let hintAnimation;
  let hintSeen = false;

  const reduced = () => {
    let saved = false;
    try { saved = sessionStorage.getItem('interdiz-reduced') === 'true'; } catch {}
    return preference.matches || saved || document.documentElement.classList.contains('reduced-motion');
  };

  // Each transition is finite. No auto-advance, looping chart or background ticker.
  function stopAnimation() {
    animation?.revert();
    animation = null;
  }

  function stopHint() {
    hintAnimation?.revert();
    hintAnimation = null;
  }

  function dismissHint() {
    hintSeen = true;
    stopHint();
  }

  // Demonstrate that the other tabs respond, without changing the reader's selection.
  // One short pass, only while the controls are visible; any intentional input cancels it.
  function showHint() {
    if (hintSeen || reduced() || !window.gsap || document.hidden) return;
    hintSeen = true;
    hintAnimation = window.gsap.context(() => {
      const timeline = window.gsap.timeline({ delay: .65, onComplete: stopHint });
      tabs.filter((_, index) => index !== active).forEach((tab, index) => {
        const arrow = tab.querySelector('.seo-tab-arrow');
        const label = tab.children[1];
        const start = index * .55;
        timeline.fromTo(tab, { '--seo-tab-hint': 0 }, {
          '--seo-tab-hint': 1, duration: .25, ease: 'power2.out'
        }, start).to(tab, { '--seo-tab-hint': 0, duration: .5, ease: 'power2.inOut' }, start + .3);
        timeline.to(label, { x: 4, duration: .25, ease: 'power2.out' }, start)
          .to(label, { x: 0, duration: .5, ease: 'power2.inOut' }, start + .3);
        // Animate translate so the active arrow's CSS rotation is never overwritten.
        timeline.fromTo(arrow, { translate: '0px 0px' }, {
          translate: '5px -5px', duration: .25, ease: 'power2.out'
        }, start).to(arrow, { translate: '0px 0px', duration: .5, ease: 'power2.inOut' }, start + .3);
      });
    }, tablist);
  }

  function stopMotion() { stopAnimation(); stopHint(); }

  function animate() {
    stopAnimation();
    if (reduced() || !window.gsap || document.hidden) return;
    const scene = scenes[active];
    animation = window.gsap.context(() => {
      const timeline = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline.from(panels[active].children, {
        y: 22, opacity: 0, stagger: .045, duration: .55,
        clearProps: 'transform,opacity'
      }, 0);
      timeline.from(scene.querySelectorAll('[data-seo-piece]'), {
        y: 18, opacity: 0, duration: .7, stagger: .065, clearProps: 'transform,opacity'
      }, .04);
      if (active === 0) {
        timeline.fromTo(scene.querySelector('.seo-scan'), { y: -20, opacity: 0 }, {
          y: 152, opacity: 1, duration: 1.1, ease: 'power2.inOut'
        }, .15).to(scene.querySelector('.seo-scan'), { opacity: 0, duration: .25 }, 1.25);
        timeline.from(scene.querySelector('.seo-checks'), { opacity: 0, duration: .4 }, .8);
      }
      if (active === 1) {
        timeline.fromTo(scene.querySelector('.seo-route'), { strokeDasharray: 1, strokeDashoffset: 1 }, {
          strokeDashoffset: 0, duration: .95, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset'
        }, .15);
        timeline.from(scene.querySelector('.seo-route-node'), { scale: 0, transformOrigin: 'center', duration: .35, clearProps: 'transform,transformOrigin' }, .55);
      }
      if (active === 3) {
        timeline.from(scene.querySelectorAll('.seo-bars rect'), {
          scaleY: 0, transformOrigin: 'center bottom', stagger: .06, duration: .65, clearProps: 'transform,transformOrigin'
        }, .12);
        timeline.fromTo(scene.querySelector('.seo-chart-line'), { strokeDasharray: 1, strokeDashoffset: 1 }, {
          strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset'
        }, .2);
        timeline.from(scene.querySelectorAll('.seo-chart-dots circle'), { opacity: 0, stagger: .08, duration: .3, clearProps: 'opacity' }, .4);
      }
    }, lab);
  }

  function select(index, play = true) {
    stopAnimation();
    active = index;
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].classList.toggle('is-active', selected);
      panels[i].setAttribute('aria-hidden', String(!selected));
      panels[i].inert = !selected;
      panels[i].tabIndex = selected ? 0 : -1;
      scenes[i].classList.toggle('is-active', selected);
    });
    lab.querySelector('.seo-lab-count').textContent = `0${index + 1} / 04`;
    lab.querySelector('.seo-visual-subject').textContent = subjects[index];
    lab.querySelector('.seo-visual-detail').textContent = details[index];
    if (play) { seen = true; animate(); }
  }

  panels.forEach((panel, index) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs[index].id);
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { if (active !== index) select(index); });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      tabs[next].focus({ preventScroll: true });
      if (active !== next) select(next);
    });
  });
  ['pointerdown', 'pointerover', 'focusin', 'keydown', 'click'].forEach(type => {
    tablist.addEventListener(type, dismissHint);
  });
  lab.classList.add('is-enhanced');
  lab.querySelector('.seo-lab-caption').textContent = 'Нажмите на вкладку — раскройте детали';
  tablist.setAttribute('aria-describedby', 'seo-tabs-hint');
  tablist.hidden = false;
  select(0, false);

  const hintObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && entries[0].intersectionRatio >= .75) showHint();
    else stopHint();
  }, { threshold: .75, rootMargin: '-110px 0px -20px 0px' });
  hintObserver.observe(tablist);

  // Overlapping grid panels reserve the tallest text, including after font/width changes.
  // Switching tabs never shifts the page or refreshes the shared scroll animations.
  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) { stopAnimation(); return; }
    if (!seen) { seen = true; animate(); }
  }, { threshold: .15 });
  observer.observe(lab);
  preference.addEventListener('change', stopMotion);
  compact.addEventListener('change', stopMotion);
  const rootObserver = new MutationObserver(() => { if (reduced()) stopMotion(); });
  rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMotion(); });
  addEventListener('pagehide', stopMotion);
  addEventListener('pageshow', () => { if (reduced()) stopMotion(); });
}
