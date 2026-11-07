// A finger previews the same effect as a hovering mouse until it lifts or starts scrolling.
export function trackPointerMotion(element, move, reset) {
  const touchStart = event => { if (event.pointerType !== 'mouse' && event.isPrimary) move(event); };
  const pointerMove = event => { if (event.isPrimary) move(event); };
  const touchEnd = event => { if (event.pointerType !== 'mouse' && event.isPrimary) reset(); };
  element.addEventListener('pointerdown', touchStart, { passive: true });
  element.addEventListener('pointermove', pointerMove, { passive: true });
  element.addEventListener('pointerup', touchEnd);
  element.addEventListener('pointerleave', reset);
  element.addEventListener('pointercancel', reset);
  return () => {
    element.removeEventListener('pointerdown', touchStart);
    element.removeEventListener('pointermove', pointerMove);
    element.removeEventListener('pointerup', touchEnd);
    element.removeEventListener('pointerleave', reset);
    element.removeEventListener('pointercancel', reset);
  };
}
