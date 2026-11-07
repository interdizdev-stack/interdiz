import { setupDesignFormats } from './design-formats.js';
import { setupSEOPageMotion } from './seo-motion.js';

const compactQuery = '(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)';

// The home page's local GSAP engine and easing, with native page scrolling.
export function setupServiceMotion() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const page = document.querySelector('.service-page');
  const web = page.classList.contains('web-service');
  const seo = page.classList.contains('seo-service');
  const root = document.documentElement;
  const seen = new WeakSet();
  const media = gsap.matchMedia();
  const all = (selector, scope = page) => [...scope.querySelectorAll(selector)];
  const savedPreference = () => {
    try { return sessionStorage.getItem('interdiz-reduced') === 'true'; } catch { return false; }
  };
  let userReduced = savedPreference();

  // Outer elements remain stable scroll triggers; only their contents move.
  all('.service-format:not(.design-format, .crm-format, .seo-format, .ads-format, .support-format)').forEach(card => {
    const body = document.createElement('div');
    body.className = 'service-format-body';
    const content = document.createElement('div');
    content.className = 'service-format-content';
    content.append(...card.childNodes);
    body.append(content);
    card.append(body);
  });
  all('.service-section > .section-kicker, .contact > .section-kicker').forEach(kicker => {
    const line = document.createElement('span');
    line.className = 'service-line-effect';
    line.setAttribute('aria-hidden', 'true');
    const pulse = document.createElement('span');
    pulse.className = 'service-line-pulse';
    line.append(pulse);
    kicker.append(line);
  });
  all('.service-format:not(.design-format, .crm-format, .seo-format, .ads-format, .support-format), .service-process li').forEach(item => {
    const trace = document.createElement('span');
    trace.className = 'service-row-trace';
    trace.setAttribute('aria-hidden', 'true');
    item.append(trace);
  });
  if (web) all('.service-projects .project-image').forEach(preview => {
    const curtain = document.createElement('span');
    curtain.className = 'web-project-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    preview.append(curtain);
  });

  function install() {
    media.revert();
    media.add({
      always: 'all', compact: compactQuery,
      reduce: '(prefers-reduced-motion: reduce)',
      pointer: '(hover: hover) and (pointer: fine)'
    }, context => {
      const { compact, pointer, reduce } = context.conditions;
      const reduced = reduce || userReduced;
      root.classList.toggle('reduced-motion', reduced);
      root.classList.toggle('service-motion-enabled', !reduced);
      if (reduced) return;
      const entrances = new Map();
      const scrollEffects = new Map();
      const duration = compact ? .6 : .9;
      const scrub = compact ? true : .55;

      function entrance(trigger, compose, start = 'top 96%') {
        if (seen.has(trigger) || trigger.getBoundingClientRect().bottom < 0) return;
        const timeline = gsap.timeline({
          defaults: { duration, ease: 'power3.out', clearProps: 'transform,opacity,visibility,clipPath' },
          scrollTrigger: { trigger, start, once: true },
          onComplete: () => seen.add(trigger)
        });
        compose(timeline);
        entrances.set(trigger, timeline);
      }
      function rise(element, trigger = element, distance = compact ? 24 : 42) {
        if (!element || !trigger) return;
        entrance(trigger, tl => tl.from(element, { y: distance, opacity: 0 }));
      }
      function pulse(kicker) {
        entrance(kicker, tl => {
          const spark = kicker.querySelector('.service-line-pulse');
          tl.from(all('.kicker-index, .kicker-meta', kicker), { y: 12, opacity: 0, stagger: .06, duration: .55 }, 0);
          if (spark) tl.fromTo(spark, { x: () => -spark.offsetWidth, opacity: 0 }, {
            x: () => kicker.clientWidth, opacity: 1, duration: .55, ease: 'power2.inOut', clearProps: 'transform'
          }, 0).to(spark, { opacity: 0, duration: .15 }, .4);
        });
      }

      const intro = page.querySelector('.service-intro');
      const heroLines = all('.service-title .hero-line', intro);
      pulse(intro.querySelector('.section-kicker'));
      rise(intro.querySelector('.page-switch'));
      entrance(intro.querySelector('.service-title'), tl => {
        tl.from(heroLines, {
          x: compact ? 14 : 48, rotationX: compact ? 0 : -18,
          transformPerspective: 1400, transformOrigin: '50% 100%',
          clipPath: 'inset(-20% 100% -20% -15%)', opacity: .15,
          stagger: .16, duration: compact ? .9 : 1.25, ease: 'power4.out',
          clearProps: 'transform,transformOrigin,opacity,clipPath'
        });
      });
      all('.hero-description, .service-actions, .service-intro-note', intro).forEach(element => rise(element));
      // Entrance owns transform; scroll separation uses independent translate.
      gsap.to(heroLines, {
        '--service-hero-x': i => `${(i ? 1 : -1) * (compact ? 22 : web ? 140 : 100)}px`,
        '--service-hero-y': i => `${compact ? (i ? -4 : -10) : web ? (i ? -20 : -55) : (i ? -14 : -30)}px`, ease: 'none',
        scrollTrigger: { id: 'service-hero-separation', trigger: intro, start: 'top top', end: 'bottom top', scrub, invalidateOnRefresh: true }
      });

      all('.service-section > .section-kicker, .contact > .section-kicker').forEach(pulse);
      all('.service-section > .service-title').forEach(title => {
        entrance(title, tl => {
          tl.from(all('.hero-line', title), {
            x: i => (i ? 1 : -1) * (compact ? 8 : 36),
            rotationX: compact ? 0 : -12, transformPerspective: 1200,
            clipPath: 'inset(-20% 100% -20% -15%)', opacity: .25,
            stagger: .13, duration: compact ? .75 : 1.05, ease: 'power4.out'
          });
        });
      });
      all('.service-section > .hero-description').forEach(element => rise(element));

      // Different depths in each column echo the home page's services rail.
      all('.service-format:not(.design-format, .crm-format, .seo-format, .ads-format, .support-format)').forEach((card, index) => {
        const content = card.querySelector('.service-format-content');
        if (web) {
          const assembly = gsap.timeline({
            scrollTrigger: {
              id: `web-format-assembly-${index}`, trigger: card,
              start: 'top 96%', end: 'top 55%', scrub, invalidateOnRefresh: true
            }
          });
          assembly.fromTo(all('.service-eyebrow, h3, p, .service-format-note', content), {
            y: i => (compact ? 18 : 36) + i * (compact ? 5 : 12),
            x: (index % 2 ? 1 : -1) * (compact ? 8 : 28), opacity: .12
          }, { y: 0, x: 0, opacity: 1, duration: 1, stagger: .14, ease: 'power2.out' });
          scrollEffects.set(card, assembly);
        } else gsap.fromTo(content, {
          y: compact ? 30 : 90 + index % 2 * 55,
          rotationX: compact ? 0 : 7, transformPerspective: 1100, opacity: .35
        }, {
          y: 0, rotationX: 0, opacity: 1, ease: 'none',
          scrollTrigger: { id: `service-format-depth-${index}`, trigger: card, start: 'top 98%', end: 'top 58%', scrub, invalidateOnRefresh: true }
        });
        gsap.fromTo(card.querySelector('.service-row-trace'), { scaleX: 0 }, {
          scaleX: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 45%', scrub }
        });
      });

      const stopDesignFormats = setupDesignFormats({ page, gsap, compact, pointer });

      // The content assembles in reading order and the rule tracks scroll progress.
      all('.service-process li').forEach((row, index) => {
        entrance(row, tl => tl.from(all('.service-step-number, h3, p, .service-step-output', row), {
          x: compact ? 12 : web ? 48 : 28, y: compact ? 10 : web ? 28 : 18, opacity: 0,
          stagger: compact ? .035 : web ? .1 : .07, duration: web ? .8 : .6,
          ...(web ? { clipPath: 'inset(0 -8% 100% -8%)' } : {})
        }));
        gsap.fromTo(row.querySelector('.service-row-trace'), { scaleX: 0 }, {
          scaleX: 1, ease: 'none',
          scrollTrigger: { id: `service-stage-line-${index}`, trigger: row, start: 'top 80%', end: 'top 40%', scrub }
        });
      });
      const handover = page.querySelector('.service-handover');
      if (handover) {
        scrollEffects.set(handover, gsap.fromTo(handover, {
          y: compact ? 24 : 80, scale: compact ? .98 : .96, opacity: .4
        }, {
          y: 0, scale: 1, opacity: 1, ease: 'none',
          scrollTrigger: {
            id: 'service-handover-parallax', trigger: '.service-handover-stage',
            start: 'top 98%', end: 'top 62%', scrub, invalidateOnRefresh: true
          }
        }));
      }

      all('.service-projects .project-card').forEach((card, index) => {
        const image = card.querySelector('.project-preview img');
        entrance(card, tl => {
          tl.from(card, {
            x: compact ? Math.min(innerWidth * .18, 70) : 220 + index * 160,
            rotationY: compact ? 0 : -7, transformPerspective: 1200,
            opacity: 1, duration: compact ? .65 : 1, clearProps: 'transform,opacity'
          }, 0);
          if (web) {
            tl.fromTo(card.querySelector('.web-project-curtain'), { scaleX: 1 }, {
              scaleX: 0, duration: compact ? .8 : 1.15, ease: 'power4.inOut', clearProps: 'transform'
            }, .08);
            tl.fromTo(image, { '--web-image-scale': 1.15 }, {
              '--web-image-scale': 1, duration: compact ? 1 : 1.4, ease: 'power3.out'
            }, .12);
            tl.from(all('.project-topic, .project-info h3, .project-info h3 + p', card), {
              y: compact ? 14 : 26, opacity: 0, stagger: .08, duration: .6
            }, .35);
          }
        }, 'top 98%');
        const travel = () => Math.min(compact ? 8 : 20, image.clientHeight * .025);
        gsap.fromTo(image, { '--service-image-y': () => `${travel()}px` }, {
          '--service-image-y': () => `${-travel()}px`, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub, invalidateOnRefresh: true }
        });
      });
      rise(page.querySelector('.service-all-projects'));

      const questions = page.querySelector('.service-questions');
      scrollEffects.set(questions, gsap.fromTo(questions, { y: compact ? 20 : 80 }, {
        y: 0, ease: 'none',
        scrollTrigger: { id: 'service-faq-depth', trigger: '#questions', start: 'top bottom', end: 'top 35%', scrub, invalidateOnRefresh: true }
      }));
      const stopFAQ = setupAnimatedFAQ(gsap, ScrollTrigger, questions, compact);
      const stopSEO = seo ? setupSEOPageMotion({ page, gsap, compact, pointer, entrance }) : () => {};
      if (web) all('details', questions).forEach(row => {
        entrance(row, tl => tl.from(row, {
          x: compact ? 14 : 36, opacity: .15, duration: compact ? .5 : .7
        }));
      });

      const contact = page.querySelector('.contact');
      const contactTitle = contact.querySelector('.contact-hero h2');
      scrollEffects.set(contactTitle, gsap.fromTo(contactTitle, {
        y: compact ? 30 : 100, rotationX: compact ? 0 : 14, scale: compact ? 1 : .94,
        transformPerspective: 1200, transformOrigin: 'left bottom', opacity: .25
      }, {
        y: 0, rotationX: 0, scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { id: 'service-contact-depth', trigger: contact, start: 'top 95%', end: 'clamp(top 40%)', scrub, invalidateOnRefresh: true }
      }));
      all('.contact-card', contact).forEach(card => rise(card));
      rise(page.querySelector('.footer-bottom'), page.querySelector('.footer-bottom'), 16);

      function finishFocused(event) {
        entrances.forEach((timeline, element) => {
          if (element.contains(event.target)) { timeline.progress(1); timeline.scrollTrigger?.kill(false); }
        });
        scrollEffects.forEach((tween, element) => {
          if (element.contains(event.target)) { tween.progress(1); tween.scrollTrigger?.kill(false); }
        });
      }
      page.addEventListener('focusin', finishFocused);
      finishFocused({ target: document.activeElement });

      const tilts = [];
      const stopWebPointer = web && pointer && !compact ? setupWebPointerMotion(page, gsap) : () => {};
      if (pointer && !compact) all('.service-projects .project-card').forEach(card => {
        const move = event => {
          const box = card.getBoundingClientRect();
          card.style.setProperty('--tilt-y', `${((event.clientX - box.left) / box.width - .5) * 5}deg`);
          card.style.setProperty('--tilt-x', `${-((event.clientY - box.top) / box.height - .5) * 5}deg`);
        };
        const reset = () => { card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); };
        card.addEventListener('pointermove', move);
        card.addEventListener('pointerleave', reset);
        tilts.push(() => { card.removeEventListener('pointermove', move); card.removeEventListener('pointerleave', reset); reset(); });
      });
      return () => {
        stopDesignFormats();
        stopWebPointer();
        stopSEO();
        stopFAQ();
        page.removeEventListener('focusin', finishFocused);
        tilts.forEach(stop => stop());
        root.classList.remove('service-motion-enabled');
      };
    });
    ScrollTrigger.refresh();
  }
  install();
  addEventListener('pageshow', event => {
    const next = savedPreference();
    if (next !== userReduced) { userReduced = next; install(); }
    else if (event.persisted) ScrollTrigger.refresh();
  });
  addEventListener('pagehide', event => { if (!event.persisted) media.revert(); });
}

// Pointer movement has its own CSS properties, independent of scroll/entrance transforms.
// Called within matchMedia so reduced motion, coarse pointers and resize revert all tweens.
function setupWebPointerMotion(page, gsap) {
  const cleanup = [];
  function track(element, move, reset, properties) {
    const pointerMove = event => { if (event.pointerType === 'mouse') move(event); };
    element.addEventListener('pointermove', pointerMove);
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    element.addEventListener('focusin', reset);
    cleanup.push(() => {
      element.removeEventListener('pointermove', pointerMove);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointercancel', reset);
      element.removeEventListener('focusin', reset);
      properties.forEach(property => element.style.removeProperty(property));
    });
  }
  page.querySelectorAll('.service-actions > .contact-pill, .service-all-projects, .page-header > .contact-pill').forEach(button => {
    const x = gsap.quickTo(button, '--web-button-x', { duration: .45, ease: 'power3.out' });
    const y = gsap.quickTo(button, '--web-button-y', { duration: .45, ease: 'power3.out' });
    track(button, event => {
      const rect = button.getBoundingClientRect();
      x(gsap.utils.clamp(-6, 6, (event.clientX - rect.left - rect.width / 2) * .08));
      y(gsap.utils.clamp(-4, 4, (event.clientY - rect.top - rect.height / 2) * .14));
    }, () => { x(0); y(0); }, ['--web-button-x', '--web-button-y']);
  });
  page.querySelectorAll('.service-format').forEach(card => {
    const glow = gsap.quickTo(card, '--web-light-opacity', { duration: .45, ease: 'power2.out' });
    const shift = gsap.quickTo(card, '--web-copy-x', { duration: .5, ease: 'power3.out' });
    track(card, event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--web-light-x', `${(event.clientX - rect.left) / rect.width * 100}%`);
      card.style.setProperty('--web-light-y', `${(event.clientY - rect.top) / rect.height * 100}%`);
      glow(.4);
      shift(6);
    }, () => { glow(0); shift(0); }, ['--web-light-x', '--web-light-y', '--web-light-opacity', '--web-copy-x']);
  });
  page.querySelectorAll('.service-process li').forEach(row => {
    const shift = gsap.quickTo(row, '--web-row-x', { duration: .45, ease: 'power3.out' });
    track(row, () => shift(8), () => shift(0), ['--web-row-x']);
  });
  return () => cleanup.forEach(stop => stop());
}

function setupAnimatedFAQ(gsap, ScrollTrigger, list, compact) {
  const cleanup = [];
  list.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector('summary');
    const answer = details.querySelector('p');
    let expanded = details.open;
    let tween;
    const toggle = event => {
      event.preventDefault();
      expanded = !expanded;
      const height = details.getBoundingClientRect().height;
      tween?.kill();
      gsap.killTweensOf(answer);
      details.open = true;
      gsap.set(details, { height: 'auto' });
      const border = parseFloat(getComputedStyle(details).borderBottomWidth);
      const target = expanded ? details.getBoundingClientRect().height : summary.offsetHeight + border;
      tween = gsap.fromTo(details, { height, overflow: 'hidden' }, {
        height: target, duration: compact ? .28 : .4, ease: 'power2.inOut',
        onComplete: () => {
          details.open = expanded;
          gsap.set(details, { clearProps: 'height,overflow' });
          gsap.set(answer, { clearProps: 'transform,opacity' });
          ScrollTrigger.refresh();
        }
      });
      if (expanded) gsap.fromTo(answer, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .3, delay: .07, ease: 'power2.out' });
      else gsap.to(answer, { y: -6, opacity: 0, duration: .18, ease: 'power2.out' });
    };
    summary.addEventListener('click', toggle);
    cleanup.push(() => {
      summary.removeEventListener('click', toggle);
      tween?.kill();
      gsap.killTweensOf(answer);
      details.open = expanded;
      gsap.set(details, { clearProps: 'height,overflow' });
      gsap.set(answer, { clearProps: 'transform,opacity' });
    });
  });
  return () => cleanup.forEach(stop => stop());
}
