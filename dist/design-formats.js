import { trackPointerMotion } from './pointer-motion.js';

// Called inside the service page's GSAP matchMedia context. Reverting that
// context restores every SVG and scroll effect, including on a motion change.
export function setupDesignFormats({ page, gsap }) {
  const cards = [...page.querySelectorAll('.design-format')];
  const cleanup = [];
  cards.forEach((card, index) => {
    const visual = card.querySelector('.design-format-visual');
    const art = card.querySelector('.design-art');
    const pieces = [...card.querySelectorAll('[data-design-piece]')];
    const assembly = gsap.timeline({
      defaults: { ease: 'power2.out', duration: 1 },
      scrollTrigger: {
        id: `design-assembly-${index}`, trigger: visual,
        start: 'top 94%', end: 'top 38%', scrub: .65,
        invalidateOnRefresh: true,
      },
    });
    pieces.forEach((piece, pieceIndex) => {
      assembly.fromTo(piece, {
        x: Number(piece.dataset.fromX || 0),
        y: Number(piece.dataset.fromY || 60),
        rotation: Number(piece.dataset.fromRotation || 0),
        scale: .78, opacity: .2,
        transformOrigin: '50% 50%',
      }, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }, pieceIndex * .12);
    });
    gsap.fromTo(card.querySelector('.design-art-drift'), { y: 16.8 }, {
      y: -16.8, ease: 'none',
      scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo(card.querySelector('.design-format-meter'), { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top 82%', end: 'bottom 65%', scrub: true },
    });

    // Readable copy never depends on the scroll timeline. Only the decorative
    // canvas tilts, using separate CSS properties from the SVG assembly.
    const tiltX = gsap.quickTo(art, '--design-tilt-x', { duration: .55, ease: 'power3.out' });
    const tiltY = gsap.quickTo(art, '--design-tilt-y', { duration: .55, ease: 'power3.out' });
    const move = event => {
      const box = visual.getBoundingClientRect();
      tiltX(-(event.clientY - box.top - box.height / 2) / box.height * 10);
      tiltY((event.clientX - box.left - box.width / 2) / box.width * 12);
    };
    const reset = () => { tiltX(0); tiltY(0); };
    const stop = trackPointerMotion(visual, move, reset);
    cleanup.push(() => {
      stop();
      tiltX.tween.kill();
      tiltY.tween.kill();
      art.style.removeProperty('--design-tilt-x');
      art.style.removeProperty('--design-tilt-y');
    });
  });
  return () => cleanup.forEach(stop => stop());
}
