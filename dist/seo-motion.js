// All effects are installed inside service-motion's matchMedia context.
// The tab controller owns scene transitions; this module moves only their outer layers.
export function setupSEOPageMotion({ page, gsap, compact, pointer, entrance }) {
  const lab = page.querySelector('.seo-lab');
  const visual = lab.querySelector('.seo-visual');
  const canvas = lab.querySelector('.seo-canvas');
  const cleanup = [];

  // Static outer geometry remains the trigger, and keyboard focus finishes the entrance.
  entrance(lab, timeline => {
    timeline.from(lab.querySelector('.seo-lab-top'), { y: 12, opacity: 0, duration: .55 }, 0)
      .from(visual, {
        x: compact ? 0 : -38, y: compact ? 18 : 0, opacity: .2,
        clipPath: 'inset(0 100% 0 0)', duration: compact ? .7 : 1, ease: 'power3.out'
      }, .04)
      .from(lab.querySelector('.seo-panels'), {
        x: compact ? 0 : 38, y: compact ? 14 : 0, opacity: .2,
        duration: compact ? .6 : .85
      }, .12)
      .from(lab.querySelector('.seo-lab-bottom'), { y: 10, opacity: 0, duration: .55 }, .24);
  }, 'top 94%');

  gsap.fromTo(lab, { '--seo-edge-progress': 0 }, {
    '--seo-edge-progress': 1, ease: 'none',
    scrollTrigger: { id: 'seo-lab-edge', trigger: lab, start: 'top 92%', end: 'top 48%', scrub: true }
  });
  gsap.fromTo(canvas, { '--seo-canvas-y': compact ? 6 : 14 }, {
    '--seo-canvas-y': compact ? -6 : -14, ease: 'none',
    scrollTrigger: { id: 'seo-canvas-depth', trigger: lab.querySelector('.seo-lab-body'), start: 'top bottom', end: 'bottom top', scrub: .5 }
  });
  page.querySelectorAll('.service-questions details').forEach(row => {
    entrance(row, timeline => {
      timeline.from(row, { x: compact ? 12 : 28, opacity: .2, duration: compact ? .55 : .75 }, 0)
        .from(row.querySelector('summary > span'), { rotation: -90, opacity: 0, duration: .65 }, .08);
    });
  });

  if (!pointer || compact) return () => {};

  function track(element, move, reset, properties) {
    const handleMove = event => { if (event.pointerType === 'mouse') move(event); };
    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    element.addEventListener('focusin', reset);
    cleanup.push(() => {
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointercancel', reset);
      element.removeEventListener('focusin', reset);
      properties.forEach(property => element.style.removeProperty(property));
    });
  }
  const tiltX = gsap.quickTo(visual, '--seo-tilt-x', { duration: .65, ease: 'power3.out' });
  const tiltY = gsap.quickTo(visual, '--seo-tilt-y', { duration: .65, ease: 'power3.out' });
  const glow = gsap.quickTo(visual, '--seo-light-opacity', { duration: .5, ease: 'power2.out' });
  track(visual, event => {
    const rect = visual.getBoundingClientRect();
    const x = gsap.utils.clamp(0, 1, (event.clientX - rect.left) / rect.width);
    const y = gsap.utils.clamp(0, 1, (event.clientY - rect.top) / rect.height);
    tiltX((.5 - y) * 5);
    tiltY((x - .5) * 7);
    glow(.28);
    visual.style.setProperty('--seo-light-x', `${x * 100}%`);
    visual.style.setProperty('--seo-light-y', `${y * 100}%`);
  }, () => { tiltX(0); tiltY(0); glow(0); }, ['--seo-tilt-x', '--seo-tilt-y', '--seo-light-opacity', '--seo-light-x', '--seo-light-y']);

  page.querySelectorAll('.service-actions > .contact-pill, .page-header > .contact-pill').forEach(button => {
    const x = gsap.quickTo(button, '--seo-button-x', { duration: .45, ease: 'power3.out' });
    const y = gsap.quickTo(button, '--seo-button-y', { duration: .45, ease: 'power3.out' });
    track(button, event => {
      const rect = button.getBoundingClientRect();
      x(gsap.utils.clamp(-6, 6, (event.clientX - rect.left - rect.width / 2) * .08));
      y(gsap.utils.clamp(-4, 4, (event.clientY - rect.top - rect.height / 2) * .14));
    }, () => { x(0); y(0); }, ['--seo-button-x', '--seo-button-y']);
  });
  return () => cleanup.forEach(stop => stop());
}
