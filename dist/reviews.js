// Local version of the moving card wall from https://interdiz.ru/#reviews.
// Keep column membership stable when recycling in either direction.
export function setupReviews(isReduced) {
  const wall = document.querySelector('.reviews-wall');
  const track = wall?.querySelector('.reviews-track');
  const button = document.querySelector('.reviews-pause');
  if (!wall || !track || !button) return;
  const compactLayout = matchMedia('(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)');
  const compactDark = () => document.documentElement.dataset.theme === 'dark' && compactLayout.matches;
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
  let speed = compactDark() ? 28 : 60;
  let columnStep = 0;
  let position = 0;
  let loopItems = [];
  let canLoop = false;
  let drag = null;
  let suppressClick = false;
  let resumeTimer;

  function setPosition(value) {
    if (canLoop) {
      while (value < 0) {
        const column = loopItems.pop();
        loopItems.unshift(column);
        track.prepend(column);
        value += columnStep;
      }
      while (value >= columnStep) {
        const column = loopItems.shift();
        loopItems.push(column);
        track.append(column);
        value -= columnStep;
      }
    }
    position = Math.max(0, Math.min(wall.scrollWidth - wall.clientWidth, value));
    wall.scrollLeft = position;
    // Compensate for native pixel rounding without changing card geometry.
    track.style.transform = `translate3d(${-(position - wall.scrollLeft)}px,0,0)`;
    return position;
  }
  function measure() {
    stop();
    const wallLeft = wall.getBoundingClientRect().left;
    const ordered = [...track.querySelectorAll('.review-card')];
    const anchor = ordered.find(card => !card.hidden && card.getBoundingClientRect().right > wallLeft);
    const anchorLeft = anchor?.getBoundingClientRect().left;
    track.style.transform = '';
    track.classList.remove('is-looping');
    track.replaceChildren(...ordered);
    if (compactDark()) {
      // Reserve the tallest full review even when a source filter is active.
      // Measuring synchronously avoids a flash and keeps all text readable.
      const hidden = ordered.map(card => card.hidden);
      wall.classList.remove('is-filtered');
      ordered.forEach(card => { card.hidden = false; });
      const height = Math.max(...ordered.map(card => card.offsetHeight));
      ordered.forEach((card, index) => { card.hidden = hidden[index]; });
      wall.classList.toggle('is-filtered', source !== 'all');
      track.style.setProperty('--compact-review-height', `${Math.ceil(height)}px`);
    } else track.style.removeProperty('--compact-review-height');
    if (source === 'all') {
      // Read the existing masonry positions before changing the DOM. Wrapping
      // these exact groups prevents vertical jumps when the last column moves first.
      const groups = [];
      ordered.forEach(card => {
        const left = card.offsetLeft;
        let group = groups[groups.length - 1];
        if (!group || Math.abs(group.left - left) > 2) {
          group = { left, cards: [] };
          groups.push(group);
        }
        group.cards.push(card);
      });
      if (document.documentElement.dataset.theme !== 'dark') {
        // White version: cap every vertical column at two complete reviews.
        groups.length = 0;
        for (let index = 0; index < ordered.length; index += 2) {
          groups.push({ cards: ordered.slice(index, index + 2) });
        }
      }
      loopItems = groups.map(group => {
        const column = document.createElement('div');
        column.className = 'reviews-column';
        column.setAttribute('role', 'presentation');
        column.append(...group.cards);
        return column;
      });
      track.classList.add('is-looping');
      track.replaceChildren(...loopItems);
    } else loopItems = ordered.filter(card => !card.hidden);
    columnStep = loopItems[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 16);
    canLoop = loopItems.length > 1 && wall.scrollWidth - wall.clientWidth >= columnStep - 1;
    const target = anchor ? wall.scrollLeft + anchor.getBoundingClientRect().left - anchorLeft : wall.scrollLeft;
    const placed = setPosition(target);
    if (drag) drag.left += placed - target;
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
    speed += ((hovering ? 10 : compactDark() ? 28 : 60) - speed) * (1 - Math.exp(-7 * delta));
    setPosition(position + speed * delta);
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
    wall.classList.toggle('is-paused', paused || reduced || touching);
    if (visible && !paused && !reduced && !filtered && !focused && !touching && !document.hidden) {
      if (!frame) { position = wall.scrollLeft; frame = requestAnimationFrame(tick); }
    } else stop();
  }
  filters.forEach(filter => filter.addEventListener('click', () => {
    stop();
    source = filter.dataset.reviewsFilter;
    cards.forEach(card => { card.hidden = source !== 'all' && card.dataset.reviewPlatform !== source; });
    track.replaceChildren(...cards);
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
    // Links remain clickable, but can also serve as a drag starting point.
    if (event.pointerType === 'mouse') drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: wall.scrollLeft, moved: false };
  });
  wall.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) > 6 && Math.abs(delta) > Math.abs(event.clientY - drag.y)) {
      drag.moved = true;
      wall.setPointerCapture(event.pointerId);
      wall.classList.add('is-dragging');
      if (wall.contains(document.activeElement)) document.activeElement.blur();
    }
    if (drag.moved) {
      event.preventDefault();
      const target = drag.left - delta;
      drag.left += setPosition(target) - target;
    }
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
  addEventListener('pointerup', finish);
  document.addEventListener('visibilitychange', update);
  addEventListener('resize', () => { measure(); update(); });
  addEventListener('pagehide', stop);
  addEventListener('pageshow', update);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { rootMargin: '200px' }).observe(wall);
  measure();
  document.fonts.ready.then(() => { measure(); update(); });
  update();
  return update;
}
