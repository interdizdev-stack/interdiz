// Local version of the moving card wall from https://interdiz.ru/#reviews.
// Keep column membership stable when recycling in either direction.
export function setupReviews(isReduced) {
  const wall = document.querySelector('.reviews-wall');
  const track = wall?.querySelector('.reviews-track');
  const button = document.querySelector('.reviews-pause');
  if (!wall || !track || !button) return;
  const compactLayout = matchMedia('(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)');
  const compact = () => compactLayout.matches;
  const cards = [...track.children];
  const navigation = document.querySelector('.review-navigation');
  const previous = navigation.querySelector('[data-review-prev]');
  const next = navigation.querySelector('[data-review-next]');
  const filters = [...document.querySelectorAll('[data-reviews-filter]')];
  document.querySelector('.reviews-filters')?.removeAttribute('hidden');
  cards.forEach((card, index) => {
    const placeholder = card.querySelector('.review-card__author-icon[src$="/placeholder.webp"]');
    if (placeholder) {
      const initials = document.createElement('span');
      initials.className = 'review-card__initials compact-only';
      initials.setAttribute('aria-hidden', 'true');
      initials.textContent = card.querySelector('.review-card__author-name').textContent.trim().split(/\s+/).slice(0, 2).map(name => name[0]).join('').toUpperCase();
      placeholder.after(initials);
    }
    const quote = card.querySelector('.review-card__text');
    quote.id = `review-text-${index + 1}`;
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'review-card__more compact-only';
    more.hidden = true;
    more.textContent = 'Читать полностью';
    more.setAttribute('aria-controls', quote.id);
    more.setAttribute('aria-expanded', 'false');
    card.append(more);
    more.addEventListener('click', () => {
      const expanded = card.classList.toggle('is-expanded');
      more.textContent = expanded ? 'Свернуть' : 'Читать полностью';
      more.setAttribute('aria-expanded', String(expanded));
      if (expanded) quote.tabIndex = 0;
      else { quote.removeAttribute('tabindex'); quote.scrollTop = 0; }
      update();
    });
  });
  wall.classList.add('reviews-enhanced');
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
  let loopItems = [];
  let canLoop = false;
  let drag = null;
  let suppressClick = false;
  let resumeTimer;
  let layoutFrame = 0;

  function updateReviewTruncation() {
    if (!compact()) return;
    cards.forEach(card => {
      if (card.hidden || !card.isConnected) return;
      const quote = card.querySelector('.review-card__text');
      const more = card.querySelector('.review-card__more');
      const expanded = card.classList.contains('is-expanded');
      card.classList.remove('is-truncated', 'is-expanded');
      more.hidden = true;
      const truncated = quote.scrollHeight > quote.clientHeight + 1;
      card.classList.toggle('is-truncated', truncated);
      more.hidden = !truncated;
      if (truncated) {
        const lineHeight = parseFloat(getComputedStyle(quote).lineHeight);
        quote.style.setProperty('--review-visible-lines', Math.max(1, Math.floor(quote.clientHeight / lineHeight)));
      }
      const showFull = truncated && expanded;
      card.classList.toggle('is-expanded', showFull);
      more.textContent = showFull ? 'Свернуть' : 'Читать полностью';
      more.setAttribute('aria-expanded', String(showFull));
      if (showFull) quote.tabIndex = 0;
      else { quote.removeAttribute('tabindex'); quote.scrollTop = 0; }
    });
  }

  function updateCompactHeight() {
    if (!compact() || layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      if (!compact()) return;
      const bounds = wall.getBoundingClientRect();
      const visible = cards.filter(card => {
        if (card.hidden) return false;
        const rect = card.getBoundingClientRect();
        const overlap = Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left);
        return overlap >= Math.min(rect.width / 2, bounds.width / 4);
      });
      if (visible.length) {
        const height = Math.ceil(Math.max(...visible.map(card => card.getBoundingClientRect().height)));
        track.style.setProperty('--compact-review-height', `${height}px`);
      }
      previous.disabled = !canLoop && wall.scrollLeft <= 2;
      next.disabled = !canLoop && wall.scrollWidth - wall.clientWidth - wall.scrollLeft <= 2;
    });
  }

  function moveCompact(direction) {
    const step = (cards.find(card => !card.hidden)?.offsetWidth ?? 0) + parseFloat(getComputedStyle(track).columnGap);
    if (canLoop) {
      setPosition(wall.scrollLeft + direction * step);
      updateCompactHeight();
    } else {
      wall.scrollBy({ left: direction * step, behavior: isReduced() ? 'instant' : 'smooth' });
    }
  }

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
    navigation.hidden = !compact();
    if (compact()) {
      wall.tabIndex = 0;
      track.replaceChildren(...ordered);
      updateReviewTruncation();
      loopItems = ordered.filter(card => !card.hidden);
      columnStep = loopItems[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 16);
      canLoop = source === 'all' && loopItems.length > 1 && wall.scrollWidth - wall.clientWidth >= columnStep - 1;
      const target = anchor ? wall.scrollLeft + anchor.getBoundingClientRect().left - anchorLeft : wall.scrollLeft;
      const placed = setPosition(target);
      if (drag) drag.left += placed - target;
      updateCompactHeight();
      return;
    }
    wall.removeAttribute('tabindex');
    track.style.removeProperty('--compact-review-height');
    track.replaceChildren(...ordered);
    if (source === 'all') {
      loopItems = [];
      for (let index = 0; index < ordered.length; index += 2) {
        const column = document.createElement('div');
        column.className = 'reviews-column';
        column.setAttribute('role', 'presentation');
        column.append(...ordered.slice(index, index + 2));
        loopItems.push(column);
      }
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
    speed += ((hovering ? 10 : 60) - speed) * (1 - Math.exp(-7 * delta));
    setPosition(position + speed * delta);
  }
  function update() {
    const reduced = isReduced();
    const filtered = source !== 'all';
    const focused = wall.contains(document.activeElement);
    const reading = compact() && Boolean(wall.querySelector('.review-card.is-expanded:not([hidden])'));
    button.disabled = reduced || filtered;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', reduced || filtered ? 'Лента отзывов без движения' : paused ? 'Продолжить движение отзывов' : 'Приостановить движение отзывов');
    button.querySelector('.reviews-pause-icon').textContent = reduced || filtered ? '○' : paused ? '▷' : 'Ⅱ';
    button.querySelector('.reviews-pause-label').textContent = reduced || filtered ? 'Без движения' : paused ? 'Продолжить' : 'Пауза';
    wall.classList.toggle('is-paused', paused || reduced || touching || reading);
    const moving = visible && !paused && !reduced && !filtered && !focused && !touching && !reading && !document.hidden;
    wall.classList.toggle('is-auto-moving', compact() && moving);
    if (moving) {
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
  previous.addEventListener('click', () => moveCompact(-1));
  next.addEventListener('click', () => moveCompact(1));
  wall.addEventListener('scroll', () => {
    if (compact() && !frame && !drag) position = wall.scrollLeft;
    updateCompactHeight();
  }, { passive: true });
  const cardSizes = new ResizeObserver(updateCompactHeight);
  cards.forEach(card => cardSizes.observe(card));
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
    if (event.target.closest('.review-card__more')) return;
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
  compactLayout.addEventListener('change', () => { measure(); update(); });
  addEventListener('pagehide', stop);
  addEventListener('pageshow', update);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { rootMargin: '200px' }).observe(wall);
  measure();
  document.fonts.ready.then(() => { measure(); update(); });
  update();
  return update;
}
