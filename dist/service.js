import { setupPageNavigation } from './navigation.js';
import { setupProjectDialog } from './projects.js';
import { setupClock } from './footer.js';

setupPageNavigation();
setupProjectDialog();
setupClock();

function setupServiceMotion() {
  const page = document.querySelector('.service-page');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)');
  const active = new Map();
  const revealed = new WeakSet();
  const targets = [...page.querySelectorAll(`
    .section-kicker, .page-switch, .service-title, .hero-description,
    .service-actions, .service-intro-note, .service-format, .service-process li,
    .service-handover, .project-card, .service-all-projects, .service-questions details,
    .service-contact > .service-eyebrow, .service-contact > .contact-pill, .footer-bottom
  `)];
  let reduced;
  let observer;

  function syncPreference() {
    let saved = null;
    try { saved = sessionStorage.getItem('interdiz-reduced'); } catch {}
    reduced = preference.matches || saved === 'true';
    document.documentElement.classList.toggle('reduced-motion', reduced);
    if (reduced) {
      active.forEach((_, animation) => animation.cancel());
      active.clear();
    }
  }

  syncPreference();
  if (!window.IntersectionObserver || !Element.prototype.animate) return;

  function animate(element, frames, options = {}) {
    if (reduced) return;
    const animation = element.animate(frames, {
      duration: compact.matches ? 480 : 720,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'backwards',
      ...options
    });
    active.set(animation, element);
    const release = () => active.delete(animation);
    animation.finished.then(release, release);
  }

  page.querySelectorAll('.service-section > .section-kicker').forEach(kicker => {
    const line = document.createElement('span');
    line.className = 'service-line-effect';
    line.setAttribute('aria-hidden', 'true');
    const pulse = document.createElement('span');
    pulse.className = 'service-line-pulse';
    line.append(pulse);
    kicker.append(line);
  });

  function reveal(target, skip = false) {
    if (revealed.has(target)) return;
    revealed.add(target);
    observer.unobserve(target);
    // Content stays visible without JavaScript, after anchor jumps and on focus.
    if (skip || reduced || target.contains(document.activeElement)) return;

    const heading = target.matches('.service-title');
    const caption = target.matches('.section-kicker');
    const elements = heading ? [...target.querySelectorAll('.hero-line')]
      : caption ? [...target.querySelectorAll('.kicker-index, .kicker-meta')] : [target];
    const distance = compact.matches ? (heading ? 24 : 16) : (heading ? 42 : 28);
    let delay = 0;
    if (target.closest('.service-intro')) {
      if (heading) delay = 90;
      else if (target.matches('.hero-description, .service-intro-note')) delay = 170;
      else if (target.matches('.service-actions')) delay = 220;
    }
    if (!compact.matches && target.matches('.service-format, .project-card')) {
      delay = [...target.parentElement.children].indexOf(target) % 2 * 90;
    }
    elements.forEach((element, index) => animate(element, [
      { opacity: 0, translate: `0 ${caption ? 10 : distance}px` },
      { opacity: 1, translate: '0 0' }
    ], { delay: delay + index * (compact.matches ? 55 : 80) }));

    const pulse = target.querySelector('.service-line-pulse');
    if (pulse) animate(pulse, [
      { transform: 'translateX(-100%)', opacity: 0 },
      { opacity: 1, offset: .18 },
      { opacity: 1, offset: .7 },
      { transform: `translateX(${target.clientWidth}px)`, opacity: 0 }
    ], { duration: compact.matches ? 500 : 650, easing: 'cubic-bezier(.65, 0, .35, 1)' });
  }

  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) reveal(entry.target, entry.boundingClientRect.bottom <= 0);
    });
  }, { rootMargin: '0px 0px 24px 0px', threshold: 0 });
  targets.forEach(target => observer.observe(target));

  // Native details keep keyboard support and remain usable without animation.
  page.querySelectorAll('.service-questions details').forEach(details => {
    details.addEventListener('toggle', () => {
      const answer = details.querySelector('p');
      active.forEach((element, animation) => {
        if (element === answer) animation.cancel();
      });
      if (details.open) animate(answer, [
        { opacity: 0, translate: '0 8px' },
        { opacity: 1, translate: '0 0' }
      ], { duration: 280 });
    });
  });

  page.addEventListener('focusin', event => {
    targets.forEach(target => {
      if (target.contains(event.target)) reveal(target, true);
    });
    active.forEach((element, animation) => {
      if (element.contains(event.target)) animation.cancel();
    });
  });
  preference.addEventListener('change', syncPreference);
  addEventListener('pageshow', syncPreference);
  addEventListener('pagehide', () => {
    active.forEach((_, animation) => animation.cancel());
    active.clear();
  });
}

setupServiceMotion();
