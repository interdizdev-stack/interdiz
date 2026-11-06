import { setupDesignFormats } from './design-formats.js';

const compactQuery = '(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)';

// The home page's local GSAP engine and easing, with native page scrolling.
export function setupServiceMotion() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const page = document.querySelector('.service-page');
  const root = document.documentElement;
  const seen = new WeakSet();
  const media = gsap.matchMedia();
  const all = (selector, scope = page) => [...scope.querySelectorAll(selector)];
  const savedPreference = () => {
    try { return sessionStorage.getItem('interdiz-reduced') === 'true'; } catch { return false; }
  };
  let userReduced = savedPreference();

  // Outer elements remain stable scroll triggers; only their contents move.
  all('.service-format:not(.design-format)').forEach(card => {
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
  all('.service-format:not(.design-format), .service-process li').forEach(item => {
    const trace = document.createElement('span');
    trace.className = 'service-row-trace';
    trace.setAttribute('aria-hidden', 'true');
    item.append(trace);
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
          defaults: { duration, ease: 'power3.out', clearProps: 'transform,opacity,visibility' },
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
      entrance(intro.querySelector('.service-title'), tl => tl.from(heroLines, {
        x: i => (i ? 1 : -1) * (compact ? 22 : 68), y: compact ? 32 : 70,
        rotationX: compact ? 0 : 10, transformPerspective: 1200, opacity: 0,
        stagger: .12, duration: compact ? .75 : 1.15, ease: 'power4.out'
      }));
      all('.hero-description, .service-actions, .service-intro-note', intro).forEach(element => rise(element));
      // Entrance owns transform; scroll separation uses independent translate.
      gsap.to(heroLines, {
        '--service-hero-x': i => `${(i ? 1 : -1) * (compact ? 22 : 100)}px`,
        '--service-hero-y': i => `${compact ? (i ? -4 : -10) : (i ? -14 : -30)}px`, ease: 'none',
        scrollTrigger: { id: 'service-hero-separation', trigger: intro, start: 'top top', end: 'bottom top', scrub, invalidateOnRefresh: true }
      });

      all('.service-section > .section-kicker, .contact > .section-kicker').forEach(pulse);
      all('.service-section > .service-title').forEach(title => {
        entrance(title, tl => tl.from(all('.hero-line', title), {
          x: i => (i ? 1 : -1) * (compact ? 18 : 52), y: compact ? 24 : 44,
          opacity: .1, stagger: .09, duration: compact ? .6 : .85
        }));
      });
      all('.service-section > .hero-description').forEach(element => rise(element));

      // Different depths in each column echo the home page's services rail.
      all('.service-format:not(.design-format)').forEach((card, index) => {
        gsap.fromTo(card.querySelector('.service-format-content'), {
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
          x: compact ? 12 : 28, y: compact ? 10 : 18, opacity: 0,
          stagger: compact ? .035 : .07, duration: .6
        }));
        gsap.fromTo(row.querySelector('.service-row-trace'), { scaleX: 0 }, {
          scaleX: 1, ease: 'none',
          scrollTrigger: { id: `service-stage-line-${index}`, trigger: row, start: 'top 80%', end: 'top 40%', scrub }
        });
      });
      const handover = page.querySelector('.service-handover');
      scrollEffects.set(handover, gsap.fromTo(handover, {
        y: compact ? 24 : 80, scale: compact ? .98 : .96, opacity: .4
      }, {
        y: 0, scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: {
          id: 'service-handover-parallax', trigger: '.service-handover-stage',
          start: 'top 98%', end: 'top 62%', scrub, invalidateOnRefresh: true
        }
      }));

      all('.service-projects .project-card').forEach((card, index) => {
        entrance(card, tl => tl.from(card, {
          x: compact ? Math.min(innerWidth * .18, 70) : 220 + index * 160,
          rotationY: compact ? 0 : -7, transformPerspective: 1200,
          opacity: 1, duration: compact ? .65 : 1, clearProps: 'transform,opacity'
        }), 'top 98%');
        const image = card.querySelector('.project-preview img');
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
