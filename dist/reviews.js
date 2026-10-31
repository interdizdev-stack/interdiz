// Local version of the moving card wall from https://interdiz.ru/#reviews.
// Recycle complete columns so every review remains a real, accessible DOM node.
export function setupReviews(isReduced) {
  const wall = document.querySelector('.reviews-wall');
  const track = wall?.querySelector('.reviews-track');
  const button = document.querySelector('.reviews-pause');
  if (!wall || !track || !button) return;
  const cards = [...track.children];
  const filters = [...document.querySelectorAll('[data-reviews-filter]')];
  document.querySelector('.reviews-filters')?.removeAttribute('hidden');
  let source = 'all';
  let visible = false;
  let paused = false;
  let hovering = false;
  let touching = false;
  let frame = 0;
  let previousTime = 0;
  let speed = 60;
  let columnStep = 0;
  let position = 0;
  let drag = null;
  let suppressClick = false;
  let resumeTimer;

  function measure() {
    columnStep = cards.find(card => !card.hidden).getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 16);
    position = wall.scrollLeft;
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }
  function tick(time) {
    frame = requestAnimationFrame(tick);
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    speed += ((hovering ? 10 : 60) - speed) * (1 - Math.exp(-7 * delta));
    position += speed * delta;
    wall.scrollLeft = position;
    // Moving whole columns keeps all visible cards in the same position.
    let passes = 0;
    while (columnStep > 0 && position >= columnStep && passes++ < track.children.length) {
      const left = track.firstElementChild.offsetLeft;
      const column = [...track.children].filter(card => Math.abs(card.offsetLeft - left) < 2);
      column.forEach(card => track.append(card));
      position -= columnStep;
      wall.scrollLeft = position;
    }
    // Keep the original subpixel motion even when scrollLeft is pixel-rounded.
    track.style.transform = `translate3d(${-(position - wall.scrollLeft)}px,0,0)`;
  }
  function update() {
    const reduced = isReduced();
    const filtered = source !== 'all';
    const focused = wall.contains(document.activeElement);
    button.disabled = reduced || filtered;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', reduced || filtered ? 'Лента отзывов без движения' : paused ? 'Продолжить движение отзывов' : 'Приостановить движение отзывов');
    button.querySelector('.reviews-pause-icon').textContent = reduced || filtered ? '○' : paused ? '▷' : 'Ⅱ';
    button.querySelector('.reviews-pause-label').textContent = reduced || filtered ? 'Без движения' : paused ? 'Продолжить' : 'Пауза';
    wall.classList.toggle('is-paused', paused || reduced);
    if (visible && !paused && !reduced && !filtered && !focused && !touching && !document.hidden) {
      if (!frame) { position = wall.scrollLeft; frame = requestAnimationFrame(tick); }
    } else stop();
  }
  filters.forEach(filter => filter.addEventListener('click', () => {
    stop();
    source = filter.dataset.reviewsFilter;
    // Restore the original order even after the moving wall recycled columns.
    cards.forEach(card => {
      card.hidden = source !== 'all' && card.dataset.reviewPlatform !== source;
      track.append(card);
    });
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === filter)));
    wall.classList.toggle('is-filtered', source !== 'all');
    wall.setAttribute('aria-label', source === 'all' ? 'Лента отзывов клиентов' : 'Отзывы клиентов с Авито');
    track.style.transform = '';
    wall.scrollLeft = 0;
    measure();
    update();
  }));
  button.addEventListener('click', () => { paused = !paused; update(); });
  wall.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hovering = true; });
  wall.addEventListener('pointerleave', () => { hovering = false; });
  wall.addEventListener('focusin', update);
  wall.addEventListener('focusout', () => queueMicrotask(update));
  wall.addEventListener('wheel', event => {
    if (!event.deltaX && !event.shiftKey) return;
    clearTimeout(resumeTimer);
    touching = true;
    stop();
    resumeTimer = setTimeout(() => { touching = false; update(); }, 600);
  }, { passive: true });
  wall.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    clearTimeout(resumeTimer);
    touching = true;
    update();
    if (event.pointerType === 'mouse' && !event.target.closest('a')) drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: wall.scrollLeft, moved: false };
  });
  wall.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) > 6 && Math.abs(delta) > Math.abs(event.clientY - drag.y)) {
      drag.moved = true;
      wall.setPointerCapture(event.pointerId);
      wall.classList.add('is-dragging');
    }
    if (drag.moved) { event.preventDefault(); wall.scrollLeft = drag.left - delta; }
  });
  function finish(event) {
    if (!touching) return;
    if (drag && event.pointerId !== drag.id) return;
    suppressClick = Boolean(drag?.moved);
    drag = null;
    touching = false;
    wall.classList.remove('is-dragging');
    if (wall.hasPointerCapture(event.pointerId)) wall.releasePointerCapture(event.pointerId);
    setTimeout(() => { suppressClick = false; }, 0);
    resumeTimer = setTimeout(update, 600);
  }
  wall.addEventListener('pointerup', finish);
  wall.addEventListener('pointercancel', finish);
  wall.addEventListener('lostpointercapture', finish);
  wall.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); } }, true);
  wall.addEventListener('dragstart', event => event.preventDefault());
  // Touch scrolling can finish beyond the wall without pointer capture.
  addEventListener('pointerup', finish);
  document.addEventListener('visibilitychange', update);
  addEventListener('resize', measure);
  addEventListener('pagehide', stop);
  addEventListener('pageshow', update);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { rootMargin: '200px' }).observe(wall);
  measure();
  document.fonts.ready.then(measure);
  update();
  return update;
}
