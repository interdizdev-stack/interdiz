import { setupPageNavigation } from './navigation.js';

setupPageNavigation();

const root = document.documentElement;
const button = document.querySelector('.journal-motion');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
try { paused = sessionStorage.getItem('interdiz-reduced') === 'true'; } catch {}
let media;
let synchronizeLoops = () => {};

function installMotion() {
  media?.revert();
  const reduced = preference.matches || paused;
  root.classList.toggle('reduced-motion', reduced);
  button.setAttribute('aria-pressed', String(reduced));
  button.disabled = preference.matches;
  button.querySelector('[data-motion-label]').textContent = preference.matches ? 'Без анимации' : paused ? 'Включить анимации' : 'Пауза анимации';
  button.firstElementChild.textContent = reduced ? '▷' : 'Ⅱ';
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  button.hidden = false;
  gsap.registerPlugin(ScrollTrigger);
  media = gsap.matchMedia();
  media.add({ always: 'all', compact: '(max-width: 699px)', pointer: '(hover: hover) and (pointer: fine)' }, context => {
    if (reduced) return;
    const { compact, pointer } = context.conditions;
    const loops = [];
    synchronizeLoops = () => loops.forEach(item => item.animation.paused(!item.visible || document.hidden));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => loops.filter(item => item.element === entry.target).forEach(item => { item.visible = entry.isIntersecting; }));
      synchronizeLoops();
    });
    const loop = (selector, animation) => {
      const element = document.querySelector(selector);
      loops.push({ element, animation: animation.pause(), visible: false });
      observer.observe(element);
    };
    gsap.from('.journal-heading .hero-line', { yPercent: 65, rotation: -3, opacity: 0, stagger: .12, duration: 1.1, ease: 'power4.out', clearProps: 'transform,opacity' });
    gsap.from('.journal-heading .hero-description, .journal-scroll', { y: 22, opacity: 0, stagger: .12, delay: .2, duration: .8, clearProps: 'transform,opacity' });
    gsap.from('.journal-paper', { y: 85, rotation: 0, opacity: 0, stagger: .1, duration: 1.25, ease: 'power4.out' });
    gsap.from('.journal-cover-rule', { scaleX: 0, duration: 1, delay: .5, ease: 'power3.out' });
    const fan = gsap.timeline({ scrollTrigger: { trigger: '.journal-art', start: 'top 30%', end: 'bottom top', scrub: .6 } });
    fan.to('.journal-paper--back', { rotation: -22, x: compact ? -10 : -28, y: -20, ease: 'none' }, 0)
      .to('.journal-paper--middle', { rotation: 15, x: compact ? 10 : 28, y: -10, ease: 'none' }, 0)
      .to('.journal-paper--front', { rotation: 3, y: 18, ease: 'none' }, 0);
    loop('.journal-ribbon', gsap.to('.journal-ribbon-track', { xPercent: -50, repeat: -1, duration: compact ? 35 : 45, ease: 'none' }));
    loop('.journal-art', gsap.to('.journal-asterisk', { rotation: 360, repeat: -1, duration: 28, ease: 'none' }));
    loop('.journal-empty-visual', gsap.to('.journal-writing-cursor', { opacity: .15, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
    gsap.from('.journal-catalog-heading, .journal-empty-copy', { y: compact ? 24 : 42, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.journal-catalog', start: 'top 85%', once: true } });
    gsap.from('.journal-writing-lines i', { scaleX: 0, stagger: .15, duration: 1, ease: 'power3.inOut', scrollTrigger: { trigger: '.journal-empty', start: 'top 85%', once: true } });
    gsap.from('.journal-topics li', { y: 20, opacity: 0, stagger: .1, duration: .65, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.journal-topics', start: 'top 92%', once: true } });
    gsap.from('.contact-hero h2', { y: 35, opacity: .2, duration: 1, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.contact-hero', start: 'top 90%', once: true } });
    const art = document.querySelector('.journal-art');
    const stack = document.querySelector('.journal-paper-stack');
    const move = event => {
      const rect = art.getBoundingClientRect();
      gsap.to(stack, { rotationY: ((event.clientX - rect.left) / rect.width - .5) * 12, rotationX: ((event.clientY - rect.top) / rect.height - .5) * -10, duration: .6, overwrite: 'auto', ease: 'power2.out' });
    };
    const reset = () => gsap.to(stack, { rotationX: 0, rotationY: 0, duration: .8, overwrite: 'auto' });
    if (pointer) { art.addEventListener('pointermove', move); art.addEventListener('pointerleave', reset); }
    return () => {
      observer.disconnect();
      synchronizeLoops = () => {};
      art.removeEventListener('pointermove', move);
      art.removeEventListener('pointerleave', reset);
      gsap.killTweensOf(stack);
      gsap.set(stack, { clearProps: 'transform' });
    };
  });
}

button.addEventListener('click', () => {
  paused = !paused;
  try { sessionStorage.setItem('interdiz-reduced', String(paused)); } catch {}
  installMotion();
});
preference.addEventListener('change', installMotion);
document.addEventListener('visibilitychange', () => synchronizeLoops());
installMotion();
document.fonts.ready.then(() => window.ScrollTrigger?.refresh());
addEventListener('pagehide', event => { if (!event.persisted) media?.revert(); });
