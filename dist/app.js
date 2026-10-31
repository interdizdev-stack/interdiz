import { setupReviews } from './reviews.js';

// Content and links are usable without animation or WebGL.
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

// Keep the dark chapter caption on the same top rail as the opening caption.
if (document.documentElement.dataset.theme === 'dark') {
  const caption = $('.hero-chapter > .mono-meta');
  if (caption) {
    const spacer = caption.cloneNode(true);
    spacer.style.visibility = 'hidden';
    spacer.setAttribute('aria-hidden', 'true');
    caption.replaceWith(spacer);
    caption.classList.add('hero-topline', 'hero-chapter-topline');
    caption.setAttribute('aria-hidden', 'true');
    $('.hero').append(caption);
  }
}
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let userReduced = null;
try { const saved=sessionStorage.getItem('interdiz-reduced'); if(saved!==null) userReduced=saved==='true'; } catch {}
let reduced = userReduced ?? motionPreference.matches;
let scene, animationContext, smoother;
let heroTrigger;
let updateProcessOnScroll;
let finishProcessAnimations;
let updateReviewsMotion;
const pageScroll = () => smoother?.scrollTop() ?? scrollY;

const menuSections = $$('.floating-nav .float-links a').map(link => ({
  link, section: document.querySelector(link.getAttribute('href'))
})).filter(item => item.section);
let activeMenuLink = null;
function updateActiveMenu() {
  const rail = Math.max(120, innerHeight * 0.3);
  let active = null;
  for (const item of menuSections) {
    if (item.section.getBoundingClientRect().top <= rail && (!active || item.section.getBoundingClientRect().top > document.querySelector(active.getAttribute('href')).getBoundingClientRect().top)) active = item.link;
  }
  if (innerHeight + pageScroll() >= document.documentElement.scrollHeight - 4) {
    active = menuSections.at(-1)?.link ?? active;
  }
  if (active === activeMenuLink) return;
  activeMenuLink = active;
  menuSections.forEach(({ link }) => {
    link.classList.toggle('is-current', link === active);
    if (link === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

const updateProgress = () => {
  const distance = document.documentElement.scrollHeight - innerHeight;
  const position = pageScroll();
  const progress = distance > 0 ? position / distance : 0;
  const progressEl = $('.scroll-progress span');
  if (progressEl) progressEl.style.transform = `scaleX(${progress})`;

  const floatNav = $('#floating-nav');
  if (floatNav) {
    floatNav.classList.toggle('visible', position > 260);
  }
};
addEventListener('scroll', updateProgress, { passive: true });

const projects = {
  mama: { title: 'Я — мама', description: 'Лендинг и ASO-креативы для мобильного приложения. Мягкий визуальный язык, передающий заботу и эмоциональное доверие.', image: './assets/mama.webp', link: 'https://interdiz.ru/portfolio.html' },
  poplavok: { title: 'Поплавок', description: 'Новая digital-глава ресторана у воды в Астрахани. Веб-дизайн, UX/UI, разработка на WordPress и интеграция Telegram / MAX.', image: './assets/poplavok.webp', link: 'https://interdiz.ru/portfolio.html' },
  health: { title: 'Health Culture', description: 'Фирменный стиль с ощущением абсолютной чистоты. Логотип и брендбук, превращающие культуру здоровья в системный визуальный код.', image: './assets/health-culture.webp', link: 'https://www.behance.net/gallery/248062171/Health-Culture-design-with-a-sense-of-purity' },
  "pierre-magnol": {"title": "Pierre Magnol", "description": "Pierre Magnol — премиальный цветочный бутик, где флористика рассматривается как форма искусства", "image": "./assets/pierre-magnol.webp", "link": "https://www.behance.net/gallery/246354277/Pierre-Magnol-Digital-Storefront-Development"},
  "home30": {"title": "HOME30", "description": "Городская роскошь в черно-оранжевых тонах: разработка веб-сайта хостела HOME30", "image": "./assets/home30.webp", "link": "https://www.behance.net/gallery/246912169/Urban-Luxury-in-Black-Orange-Hostel-Website-Concept"},
  "shogun-auto": {"title": "Shogun Auto", "description": "С Востока на весь мир — фирменный стиль Shogun Auto", "image": "./assets/shogun-auto.webp", "link": "https://www.behance.net/gallery/246098169/From-East-to-World-Shogun-Auto-Brand-Identity"},
  "kyrilka": {"title": "Kyrilka", "description": "Kyrilka — контрастный дизайн для современной цифровой витрины", "image": "./assets/kyrilka.webp", "link": "https://www.behance.net/gallery/248739383/Kyrilka-Modern-E-commerce-Showcase"},
  "ivan-grozny": {"title": "Иван Грозный — Перезагрузка", "description": "Иван Грозный — когда история оживает: разработка ТВ-рекламы и афиш для регионального конкурса", "image": "./assets/ivan-grozny.webp", "link": "https://interdiz.ru/portfolio.html"},
  "divo-dental": {"title": "Divo Dental", "description": "Divo Dental — разработка логотипа для современной стоматологии", "image": "./assets/divo-dental.webp", "link": "https://www.behance.net/gallery/249932083/The-Geometry-of-Trust-A-Logo-for-a-Modern-Dental-Brand"}
};

const dialog = $('.project-dialog:not(.service-dialog)');
let dialogOpener;
$$('[data-open-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects[button.dataset.openProject];
  if (!project) return;
  dialogOpener = button;
  $('#dialog-title').textContent = project.title;
  $('.dialog-description', dialog).textContent = project.description;
  $('.dialog-image', dialog).src = project.image;
  $('.dialog-image', dialog).alt = `Проект ${project.title}`;
  $('.dialog-link', dialog).href = project.link;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}));

$('.dialog-close', dialog)?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', e => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  }
});
dialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  dialogOpener?.focus({ preventScroll: true });
});

const serviceDetails = {
  web: {
    scope: ['Структура сайта и сценарии пользователей.', 'Дизайн интерфейса и адаптация для телефона и компьютера.', 'Разработка страниц и нужных функций, подключение форм и сервисов.', 'Проверка, запуск и передача проекта.'],
    process: 'Разбираем задачу и определяем состав сайта. Согласуем структуру и дизайн, затем разрабатываем, тестируем и запускаем проект.',
    result: 'Работающий сайт или веб-приложение с согласованными функциями, доступами и инструкциями по управлению.'
  },
  design: {
    scope: ['Фирменный стиль и визуальная концепция.', 'Дизайн сайтов и интерфейсов.', 'Презентации и материалы для коммуникации с клиентами.', 'Подготовка макетов и исходных файлов.'],
    process: 'Изучаем продукт, аудиторию и задачу. Предлагаем визуальное направление, согласуем концепцию и прорабатываем выбранные материалы.',
    result: 'Согласованный комплект дизайн-материалов и исходников, готовых к разработке или использованию в коммуникациях.'
  },
  ai: {
    scope: ['Сценарии общения и границы задач помощника.', 'Подготовка базы знаний из материалов компании.', 'Подключение бота к нужному каналу или рабочему сервису.', 'Проверка ответов и передача сложных обращений сотруднику.'],
    process: 'Выбираем задачи, которые стоит поручить помощнику. Готовим материалы, собираем сценарии и проверяем ответы на реальных вопросах перед запуском.',
    result: 'Настроенный бот или ассистент для согласованных сценариев: ответов по материалам компании, приёма обращений или поиска информации.'
  },
  crm: {
    scope: ['Разбор текущего пути заявки и повторяющихся операций.', 'Связь сайта, CRM и рабочих сервисов.', 'Автоматическая передача данных, документов и уведомлений.', 'Проверка сценариев и инструкции для сотрудников.'],
    process: 'Описываем процесс и точки, где теряются данные или время. Согласуем схему интеграций, настраиваем её и проверяем прохождение данных по всей цепочке.',
    result: 'Связанные сервисы и согласованные автоматические сценарии, которые сокращают ручную передачу данных.'
  },
  seo: {
    scope: ['Проверка структуры и технического состояния сайта.', 'Изучение поисковых запросов по вашим услугам.', 'Доработка страниц, текстов и внутренних связей.', 'Отслеживание изменений и план дальнейших улучшений.'],
    process: 'Проводим аудит и определяем приоритеты. Готовим план доработок, внедряем согласованные изменения и оцениваем их влияние по данным аналитики.',
    result: 'Сайт с улучшенной структурой, содержанием и технической основой для поиска, а также понятный план дальнейшего продвижения.'
  },
  ads: {
    scope: ['Изучение аудитории, предложений и посадочных страниц.', 'Подбор запросов и подготовка объявлений.', 'Настройка кампаний в Яндекс.Директе и отслеживания обращений.', 'Анализ результатов и корректировка рекламы.'],
    process: 'Определяем цели и согласуем бюджет. Настраиваем аналитику и кампании, запускаем рекламу и корректируем её по обращениям и другим согласованным показателям.',
    result: 'Настроенные рекламные кампании и данные об их результатах для дальнейших решений по продвижению.'
  },
  support: {
    scope: ['Обновления системы, модулей и компонентов сайта.', 'Исправление ошибок и небольшие доработки.', 'Настройка резервного копирования и проверка восстановления.', 'Проверка доступности, форм и базовых настроек безопасности.'],
    process: 'Знакомимся с сайтом и доступами, согласуем перечень задач и порядок обращений. Выполняем обновления и доработки, проверяем результат и сообщаем о выполненных работах.',
    result: 'Актуальные компоненты сайта, резервные копии и понятный порядок решения технических вопросов после запуска.'
  }
};

const serviceDialog = $('#service-dialog');
let serviceOpener;
$$('[data-open-service]').forEach(button => button.addEventListener('click', () => {
  const details = serviceDetails[button.dataset.openService];
  if (!details || !serviceDialog) return;
  const card = button.closest('.solution-card');
  serviceOpener = button;
  $('#service-dialog-title').textContent = $('h3', card).textContent;
  $('#service-dialog-description').textContent = $('p', card).textContent;
  $('.service-dialog-kicker').textContent = `[ ${card.dataset.number} // УСЛУГА INTERDIZ ]`;
  $('.service-scope-list').replaceChildren(...details.scope.map(text => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
  $('.service-process-description').textContent = details.process;
  $('.service-result-description').textContent = details.result;
  serviceDialog.showModal();
  serviceDialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
}));
$('.service-dialog-close')?.addEventListener('click', () => serviceDialog.close());
serviceDialog?.addEventListener('click', event => {
  if (event.target !== serviceDialog) return;
  const bounds = serviceDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) serviceDialog.close();
});
serviceDialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  serviceOpener?.focus({ preventScroll: true });
});
$('.service-dialog-contact')?.addEventListener('click', () => {
  serviceOpener = null;
  serviceDialog.close();
});

// Keep native summary keyboard activation while animating both directions.
function setupProcessAccordion() {
  const list = $('#expertise .service-list');
  if (!list) return;
  const rows = $$('.service', list);
  const gsap = window.gsap;
  const states = new Map();
  let scrollFrame = 0;
  let hoverTimer = 0;
  let hoveredRow = null;
  let interactionUntil = 0;
  let previousScroll = pageScroll();

  function measureGeometry() {
    let collapsedHeight = 0;
    let maximumContentHeight = 0;
    rows.forEach(row => {
      const state = states.get(row);
      // Measure outside closed details, without changing the page's layout.
      const probe = state.content.cloneNode(true);
      probe.setAttribute('aria-hidden', 'true');
      probe.inert = true;
      probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:auto;overflow:visible;width:${row.clientWidth}px`;
      list.append(probe);
      state.height = probe.getBoundingClientRect().height;
      probe.remove();
      const bounds = row.getBoundingClientRect();
      state.anchor = collapsedHeight + state.summary.getBoundingClientRect().top - bounds.top;
      collapsedHeight += bounds.height - (row.open ? state.content.getBoundingClientRect().height : 0);
      maximumContentHeight = Math.max(maximumContentHeight, state.height);
    });
    // One description slot is shared by all rows. Its size never changes while
    // switching, so ScrollSmoother's ResizeObserver cannot rebuild the hero.
    list.style.setProperty('--process-list-height', `${Math.ceil(collapsedHeight + maximumContentHeight) + 1}px`);
    rows.forEach((row, index) => {
      states.get(row).anchor += maximumContentHeight * index / rows.length;
    });
  }

  function finishRow(row) {
    const state = states.get(row);
    state.timeline?.kill();
    state.timeline = null;
    row.open = state.expanded;
    row.classList.remove('is-animating');
    gsap?.set(state.content, { clearProps: 'height,overflow' });
    gsap?.set(state.copy, { clearProps: 'opacity,transform' });
    gsap?.set(state.pulse, { clearProps: 'opacity,transform' });
    updateProgress();
  }

  function setExpanded(row, expanded, retime = false) {
    const state = states.get(row);
    if (state.expanded === expanded && !(retime && state.timeline)) return;
    state.timeline?.kill();
    const wasOpen = row.open;
    const currentHeight = wasOpen ? state.content.getBoundingClientRect().height : 0;
    state.expanded = expanded;
    row.classList.toggle('is-expanded', expanded);
    state.summary.setAttribute('aria-expanded', String(expanded));
    state.content.setAttribute('aria-hidden', String(!expanded));
    if (reduced || !gsap) {
      finishRow(row);
      return;
    }

    // Keep details open until the closing animation ends, and reverse from
    // the current height when the user switches again before it finishes.
    row.open = true;
    gsap.set(state.content, { height: currentHeight, overflow: 'hidden', autoRound: false });
    row.classList.add('is-animating');
    const timeline = gsap.timeline({ onComplete: () => finishRow(row) });
    state.timeline = timeline;
    if (expanded) {
      if (!wasOpen) gsap.set(state.copy, { y: 18, opacity: 0 });
      timeline.to(state.content, { height: state.height, autoRound: false, duration: 0.62, ease: 'power3.inOut' }, 0)
        .to(state.copy, { y: 0, opacity: 1, duration: 0.48, ease: 'power3.out' }, 0.12)
        .fromTo(state.pulse, { x: '-100%', opacity: 1 }, {
          x: () => row.clientWidth, duration: 0.8, ease: 'power2.inOut'
        }, 0)
        .to(state.pulse, { opacity: 0, duration: 0.16 }, 0.64);
    } else {
      timeline.to(state.copy, { y: -8, opacity: 0, duration: 0.18, ease: 'power2.in' }, 0)
        .to(state.content, { height: 0, autoRound: false, duration: 0.62, ease: 'power3.inOut' }, 0)
        .to(state.pulse, { opacity: 0, duration: 0.12 }, 0);
    }
  }

  function openStep(row, manual = false) {
    if (manual) interactionUntil = performance.now() + 900;
    if (states.get(row).expanded) return;
    // Matching height tweens keep their combined height within the reserved slot,
    // including interrupted transitions between three or more rows.
    rows.forEach(other => setExpanded(other, other === row, true));
  }

  function revealOnScroll() {
    scrollFrame = 0;
    if (document.body.classList.contains('dialog-open')) return;
    if (performance.now() < interactionUntil) return;
    // Keyboard users keep control of the step they are interacting with.
    if (list.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
    const readingLine = innerHeight * 0.55;
    const bounds = list.getBoundingClientRect();
    if (bounds.top > readingLine || bounds.bottom < 0) return;
    const readingPosition = readingLine - bounds.top;
    let current = rows[0];
    rows.forEach(row => {
      if (states.get(row).anchor <= readingPosition) current = row;
    });
    const activeIndex = rows.findIndex(row => states.get(row).expanded);
    const nextIndex = rows.indexOf(current);
    // A small dead band prevents boundary chatter when wheel input changes direction.
    if (activeIndex >= 0 && nextIndex > activeIndex && readingPosition < states.get(current).anchor + 20) return;
    if (activeIndex >= 0 && nextIndex < activeIndex && readingPosition > states.get(rows[activeIndex]).anchor - 20) return;
    openStep(current);
  }

  rows.forEach(row => {
    const summary = $('summary', row);
    const content = $('.service-content', row);
    const scan = document.createElement('span');
    scan.className = 'service-scan';
    scan.setAttribute('aria-hidden', 'true');
    const pulse = document.createElement('span');
    scan.append(pulse);
    row.prepend(scan);
    states.set(row, { summary, content, copy: $('p', content), pulse, expanded: row.open, timeline: null, height: 0, anchor: 0 });
    row.classList.toggle('is-expanded', row.open);
    summary.setAttribute('aria-expanded', String(row.open));
    content.setAttribute('aria-hidden', String(!row.open));
    summary.addEventListener('click', event => {
      event.preventDefault();
      clearTimeout(hoverTimer);
      interactionUntil = performance.now() + 900;
      if (states.get(row).expanded) setExpanded(row, false);
      else openStep(row, true);
    });
  });
  // Only real pointer movement selects a hovered row. Layout changes and wheel
  // scrolling beneath a stationary pointer must not start another transition.
  list.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover)').matches) return;
    if (list.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
    const row = event.target.closest('.service');
    if (row === hoveredRow) return;
    hoveredRow = row;
    clearTimeout(hoverTimer);
    if (row) hoverTimer = setTimeout(() => openStep(row, true), 100);
  });
  list.addEventListener('pointerleave', () => {
    hoveredRow = null;
    clearTimeout(hoverTimer);
  });
  list.classList.add('process-enhanced');
  measureGeometry();
  document.fonts.ready.then(measureGeometry);
  finishProcessAnimations = () => rows.forEach(finishRow);
  updateProcessOnScroll = () => {
    const position = pageScroll();
    if (Math.abs(position - previousScroll) < 1) return;
    previousScroll = position;
    if (!scrollFrame) scrollFrame = requestAnimationFrame(revealOnScroll);
  };
  addEventListener('scroll', updateProcessOnScroll, { passive: true });
  addEventListener('resize', () => {
    finishProcessAnimations();
    measureGeometry();
    if (!scrollFrame) scrollFrame = requestAnimationFrame(revealOnScroll);
  });
  requestAnimationFrame(revealOnScroll);
}

// Native details keep click and keyboard behavior; one shared answer slot keeps
// ScrollSmoother from rebuilding the pinned hero whenever a question changes.
function setupFAQ() {
  const list = $('.faq-list');
  if (!list) return;
  const rows = $$('.faq-item', list);
  function measure() {
    let collapsedHeight = 0;
    let answerHeight = 0;
    rows.forEach(row => {
      const answer = $('.faq-answer', row);
      const probe = answer.cloneNode(true);
      probe.setAttribute('aria-hidden', 'true');
      probe.inert = true;
      probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${row.clientWidth}px`;
      list.append(probe);
      answerHeight = Math.max(answerHeight, probe.getBoundingClientRect().height);
      probe.remove();
      collapsedHeight += row.getBoundingClientRect().height - (row.open ? answer.getBoundingClientRect().height : 0);
    });
    list.style.setProperty('--faq-list-height', `${Math.ceil(collapsedHeight + answerHeight) + 1}px`);
    list.classList.add('faq-enhanced');
  }
  // Also group questions in browsers without support for details[name].
  rows.forEach(row => row.addEventListener('toggle', () => {
    if (row.open) rows.forEach(other => { if (other !== row) other.open = false; });
  }));
  measure();
  document.fonts.ready.then(measure);
  addEventListener('resize', measure);
}

function updateMotionButton() {
  const btn = $('.motion-toggle');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(reduced));
  btn.setAttribute('aria-label', reduced ? 'Включить анимации' : 'Уменьшить движение');
  $('.motion-icon').textContent = reduced ? '▷' : 'Ⅱ';
  $('.motion-label').textContent = reduced ? 'Включить анимации' : 'Меньше движения';
  document.documentElement.classList.toggle('reduced-motion', reduced);
  updateReviewsMotion?.();
}
updateMotionButton();

function setupSolutionsCarousel() {
  const track = $('#solutions-track');
  if (!track) return;
  const cards = $$('.solution-card', track);
  const previous = $('[data-solutions-prev]');
  const next = $('[data-solutions-next]');
  const counter = $('[data-solution-current]');
  const progress = $('.solutions-progress');
  let activeIndex = 0;
  let requestedIndex = null;
  let frame = 0;
  let settleTimer;
  let drag = null;

  function nearestIndex() {
    const maximum = track.scrollWidth - track.clientWidth;
    if (track.scrollLeft <= 2 || maximum <= 2) return 0;
    if (maximum - track.scrollLeft <= 2) return cards.length - 1;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const candidate = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (candidate < distance) { distance = candidate; nearest = index; }
    });
    return nearest;
  }

  function render(index) {
    activeIndex = index;
    cards.forEach((card, i) => card.classList.toggle('is-active', i === index));
    const label = String(index + 1).padStart(2, '0');
    if (counter.textContent !== label) counter.textContent = label;
    progress.setAttribute('aria-valuenow', String(index + 1));
    progress.setAttribute('aria-valuetext', cards[index].querySelector('h3').textContent);
    $('span', progress).style.transform = `scaleX(${(index + 1) / cards.length})`;
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(cards.length - 1, index));
    const card = cards[target];
    const maximum = track.scrollWidth - track.clientWidth;
    const left = Math.max(0, Math.min(maximum, card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2));
    requestedIndex = target;
    render(target);
    track.scrollTo({ left, behavior: reduced ? 'instant' : 'smooth' });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { requestedIndex = null; render(nearestIndex()); }, 180);
  }

  track.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      render(requestedIndex ?? nearestIndex());
    });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { requestedIndex = null; render(nearestIndex()); }, 180);
  }, { passive: true });
  track.addEventListener('wheel', () => { requestedIndex = null; }, { passive: true });
  track.addEventListener('touchstart', () => { requestedIndex = null; }, { passive: true });
  previous.addEventListener('click', () => goTo(activeIndex - 1));
  next.addEventListener('click', () => goTo(activeIndex + 1));
  track.addEventListener('keydown', event => {
    const destinations = { ArrowLeft: activeIndex - 1, ArrowRight: activeIndex + 1, Home: 0, End: cards.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    goTo(destinations[event.key]);
  });

  track.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (event.target.closest('button, a')) return;
    requestedIndex = null;
    drag = { id: event.pointerId, x: event.clientX, left: track.scrollLeft, moved: false };
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const distance = event.clientX - drag.x;
    if (!drag.moved && Math.abs(distance) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      track.classList.add('is-dragging');
      getSelection()?.removeAllRanges();
    }
    event.preventDefault();
    track.scrollLeft = drag.left - distance;
  });
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const completed = drag;
    drag = null;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(completed.id)) track.releasePointerCapture(completed.id);
    if (completed.moved) goTo(nearestIndex());
  }
  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('lostpointercapture', finishDrag);

  cards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (reduced || event.pointerType !== 'mouse' || drag?.moved) return;
      const bounds = card.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      card.style.setProperty('--spot-x', `${x}px`);
      card.style.setProperty('--spot-y', `${y}px`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--spot-x');
      card.style.removeProperty('--spot-y');
    });
  });
  const sizing = new ResizeObserver(() => {
    requestedIndex = null;
    render(nearestIndex());
  });
  sizing.observe(track);
  $('.solutions-controls').hidden = false;
  render(0);
}

function setupProjectGallery() {
  const viewport = $('#project-gallery');
  const track = $('.project-track');
  const cards = $$('.project-card', track);
  const previous = $('[data-project-prev]');
  const next = $('[data-project-next]');
  let frame = 0;
  let drag = null;
  let suppressClick = false;
  const maximum = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const position = card => card.offsetLeft - track.offsetLeft;
  const step = () => cards.length > 1 ? position(cards[1]) - position(cards[0]) : viewport.clientWidth;

  function render() {
    frame = 0;
    const bounds = viewport.getBoundingClientRect();
    const visible = [];
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const overlap = Math.min(rect.right, bounds.right - 12) - Math.max(rect.left, bounds.left + 12);
      if (overlap >= rect.width * 0.5) visible.push(i + 1);
      const shift = Math.max(-8, Math.min(8, ((bounds.left + bounds.width / 2) - (rect.left + rect.width / 2)) * 0.015));
      card.style.setProperty('--image-shift', reduced ? '0px' : `${shift}px`);
    });
    const first = visible[0] ?? 1;
    const last = visible.at(-1) ?? first;
    $('.gallery-progress>span').style.transform = `scaleX(${(last / cards.length)})`;
    previous.disabled = viewport.scrollLeft <= 2;
    next.disabled = maximum() - viewport.scrollLeft <= 2;
  }
  function goTo(left) {
    viewport.scrollTo({left: Math.max(0, Math.min(maximum(), left)), behavior: reduced ? 'instant' : 'smooth'});
  }
  const move = direction => goTo((Math.round(viewport.scrollLeft / step()) + direction) * step());
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  viewport.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, {passive:true});
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(maximum());
    else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  viewport.addEventListener('focusin', event => {
    const card = event.target.closest('.project-card');
    if (!card || !event.target.matches(':focus-visible')) return;
    const left = position(card);
    if (left < viewport.scrollLeft) goTo(left);
    else if (left + card.offsetWidth > viewport.scrollLeft + viewport.clientWidth - 24) goTo(left + card.offsetWidth - viewport.clientWidth + 24);
  });
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = {id:event.pointerId, x:event.clientX, left:viewport.scrollLeft, moved:false};
    suppressClick = false;
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
      getSelection()?.removeAllRanges();
    }
    event.preventDefault();
    viewport.scrollLeft = drag.left - delta;
  });
  function finish(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const completed = drag;
    drag = null;
    suppressClick = completed.moved;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(completed.id)) viewport.releasePointerCapture(completed.id);
    if (completed.moved) goTo(Math.round(viewport.scrollLeft / step()) * step());
    setTimeout(() => { suppressClick = false; }, 0);
  }
  viewport.addEventListener('pointerup', finish);
  viewport.addEventListener('pointercancel', finish);
  viewport.addEventListener('lostpointercapture', finish);
  viewport.addEventListener('pointerleave', event => { if (drag && !drag.moved) finish(event); });
  viewport.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  viewport.addEventListener('dragstart', event => event.preventDefault());
  new ResizeObserver(render).observe(viewport);
  $('.gallery-controls').hidden = false;
  render();
}

function setupAnimations() {
  finishProcessAnimations?.();
  if (!window.gsap || !window.ScrollTrigger) { updateMotionButton(); return; }
  const { gsap, ScrollTrigger, ScrollSmoother } = window;
  animationContext?.revert();
  smoother?.kill();
  smoother = null;
  heroTrigger = null;
  scene?.setReduced(reduced);
  if (scene) Object.assign(scene.state, { explosion: 0, rotation: 0, zoom: 0, portal: 0, opacity: 1 });
  document.documentElement.classList.toggle('motion-enabled', !reduced);
  updateMotionButton();
  if (reduced) { scene?.refresh(); ScrollTrigger.refresh(); return; }
  gsap.registerPlugin(ScrollTrigger);
  // Smooth the page and parallax together, rather than letting scrub lag
  // fight immediate native scrolling at the edge of the pinned hero.
  if (document.documentElement.dataset.theme === 'dark' && ScrollSmoother) {
    gsap.registerPlugin(ScrollSmoother);
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1,
      smoothTouch: 0.15,
      effects: false,
      onUpdate: () => {
        updateProgress();
        updateProcessOnScroll?.();
      }
    });
  }

  animationContext = gsap.context(() => {
    const media = gsap.matchMedia();
    media.add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, context => {
      const mobile = context.conditions.mobile;
      heroTrigger = null;
      const heroTimeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'hero-scene',
          trigger: '.hero',
          start: 'top top',
          end: () => `+=${innerHeight * (mobile ? 1.65 : 2.3)}`,
          pin: true,
          scrub: smoother ? true : 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: self => {
            const index = self.progress < 0.3 ? 0 : self.progress < 0.69 ? 1 : 2;
            $$('.scene-stages>span').forEach((el, i) => el.classList.toggle('active', index === i));
            if (scene) scene.refresh();
          }
        }
      });
      heroTrigger = heroTimeline.scrollTrigger;
      heroTimeline.to('.hero-line:first-child', { xPercent: -18, y: -110, opacity: 0, duration: 0.34 }, 0)
        .to('.hero-line.outline', { xPercent: 22, y: 70, opacity: 0, duration: 0.34 }, 0)
        .to('.hero-bottom, .hero-description, .hero-actions, .hero-topline:not(.hero-chapter-topline)', { autoAlpha: 0, y: -30, duration: 0.22 }, 0)
        .fromTo('.hero-chapter', { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.26)
        .to('.hero-chapter', { autoAlpha: 0, y: -60, duration: 0.16 }, 0.57)
        .fromTo('.hero-end', { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.17 }, 0.74)
        .to('.hero-end', { scale: 1.1, duration: 0.09 }, 0.91);

      const chapterCaption = $('.hero-chapter-topline');
      if (chapterCaption) {
        heroTimeline.fromTo(chapterCaption, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.26)
          .to(chapterCaption, { autoAlpha: 0, duration: 0.16 }, 0.57);
      }

      if (scene) {
        heroTimeline.to(scene.state, { explosion: 1.4, rotation: 1.35, duration: 0.44 }, 0.07)
          .to(scene.state, { explosion: 0.16, rotation: 2.75, portal: 1, duration: 0.25 }, 0.51)
          .to(scene.state, { zoom: 1, rotation: 3.1, opacity: document.documentElement.dataset.theme === 'dark' ? 0.24 : 0.1, duration: 0.25 }, 0.75);
      }
      gsap.from('.hero-intro', { y: 45, opacity: 0, duration: 1.3, ease: 'power3.out', clearProps: 'opacity' });
      gsap.from('.hero-bottom', { y: 25, opacity: 0, duration: 1, delay: 0.2, ease: 'power2.out' });

      if (document.documentElement.dataset.theme === 'dark') {
        // Keep the scene almost stationary while the foreground slides over it.
        const transition = gsap.timeline({
          defaults: { ease: 'none', duration: 1 },
          scrollTrigger: {
            id: 'hero-solutions-parallax',
            trigger: '.manifesto',
            start: 'top bottom',
            end: 'top top',
            scrub: smoother ? true : 0.6,
            invalidateOnRefresh: true
          }
        });
        transition
          .fromTo('.hero .webgl', { y: 0, scale: 1 }, { y: () => innerHeight * 0.82, scale: 1.2, immediateRender: false }, 0)
          .fromTo('.hero-grid', { y: 0 }, { y: () => innerHeight * 0.42, immediateRender: false }, 0)
          .fromTo('.hero-end', { y: 0 }, { y: () => innerHeight * 0.64, immediateRender: false }, 0)
          .fromTo('.manifesto > .section-kicker', { y: () => innerHeight * (mobile ? 0.07 : 0.1) }, { y: 0 }, 0)
          .fromTo('.manifesto-inner', { y: () => innerHeight * (mobile ? 0.22 : 0.32) }, { y: 0 }, 0);

        // Use the section's layout coordinates: its inner content already has
        // a parallax transform, which must not shift these trigger positions.
        const cardsTop = () => $('.manifesto-inner').offsetTop + $('.solutions-stage').offsetTop;
        gsap.fromTo('.solution-card', {
          '--solution-parallax-y': i => `${(mobile ? 70 : 140) + (i % 3) * (mobile ? 18 : 48)}px`
        }, {
          '--solution-parallax-y': '0px',
          ease: 'none',
          scrollTrigger: {
            id: 'solutions-cards-parallax',
            trigger: '.manifesto',
            start: () => `top+=${cardsTop()} bottom`,
            end: () => `top+=${cardsTop()} ${mobile ? '45%' : '50%'}`,
            scrub: smoother ? true : 0.6,
            invalidateOnRefresh: true
          }
        });

        const pulse = $('.projects-line-pulse');
        const line = $('.projects-line-effect');
        const projectsReveal = gsap.timeline({
          scrollTrigger: {
            id: 'projects-pulse-horizontal-reveal',
            trigger: '.projects',
            start: 'top 95%',
            once: true,
            invalidateOnRefresh: true
          }
        });
        // Reveal the content with the accent as soon as the section enters.
        projectsReveal
          .fromTo(pulse, { x: () => -pulse.offsetWidth }, {
            x: () => line.clientWidth,
            duration: 0.55, ease: 'power2.inOut'
          }, 0)
          .fromTo(pulse, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0)
          .to(pulse, { opacity: 0, duration: 0.15 }, 0.4)
          .fromTo('.projects-heading', { y: 32, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.55, ease: 'power3.out',
            immediateRender: true, clearProps: 'transform,opacity'
          }, 0)
          .fromTo('.gallery-window', {
            x: () => Math.min(innerWidth * (mobile ? 0.35 : 0.24), mobile ? 200 : 360),
            opacity: 0
          }, {
            x: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
            immediateRender: true, clearProps: 'transform,opacity'
          }, 0.08);
      } else {
        gsap.from('.manifesto-line', { x: (i) => i % 2 ? 45 : -45, opacity: 0.2, stagger: 0.1, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: '.manifesto', start: 'top 85%', once: true } });
        gsap.from('.solution-card', { y: 45, rotationY: -8, transformPerspective: 1000, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.solutions-stage', start: 'top 90%', once: true } });
        gsap.from('.projects-heading', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.projects', start: 'top 85%', once: true } });
        gsap.from('.project-card', { y: 55, rotationY: -6, opacity: 0, transformPerspective: 1200, stagger: 0.14, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.gallery-window', start: 'top 90%', once: true } });
      }

      gsap.from('.service', { y: 35, opacity: 0, stagger: 0.08, duration: 0.65, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.service-list', start: 'top 92%', once: true } });
      gsap.from('.expertise h2', { y: 70, opacity: 0.2, scrollTrigger: { trigger: '.expertise', start: 'top 80%', end: 'top 25%', scrub: 0.6 } });
      // Move the complete FAQ with scroll; use layout coordinates so its
      // own transform cannot shift the trigger on refresh.
      const faqSection = $('.approach');
      if (faqSection) {
        const faqParallax = mobile ? 55 : 110;
        gsap.fromTo(faqSection, { y: faqParallax }, {
          y: 0,
          ease: 'none',
          scrollTrigger: {
            id: 'faq-block-parallax',
            trigger: faqSection.parentElement,
            start: () => `top+=${faqSection.offsetTop} bottom`,
            end: () => `top+=${faqSection.offsetTop} 20%`,
            scrub: smoother ? true : 0.6,
            invalidateOnRefresh: true
          }
        });
      }
      gsap.from('.approach-testimonial', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.approach-testimonial', start: 'top 90%', once: true } });
      gsap.from('.contact-hero h2', { y: 100, rotateX: 12, transformPerspective: 1200, opacity: 0.15, scrollTrigger: { trigger: '.contact', start: 'top 85%', end: 'top 15%', scrub: 0.75 } });
      gsap.from('.contact-card', { y: 40, opacity: 0, stagger: 0.12, duration: 0.7, scrollTrigger: { trigger: '.contact-grid', start: 'top 90%' } });
    });
  });
  ScrollTrigger.refresh();
}

$('.motion-toggle')?.addEventListener('click', () => {
  const previousSection = [...$$('main section[id]'), $('.contact')].findLast(el => el.getBoundingClientRect().top < innerHeight * 0.5);
  reduced = !reduced; userReduced = reduced;
  try { sessionStorage.setItem('interdiz-reduced', String(reduced)); } catch {}
  setupAnimations();
  if (previousSection) {
    if (smoother) smoother.scrollTo(previousSection, false, 'top top');
    else scrollTo({ top: previousSection.getBoundingClientRect().top + scrollY, behavior: 'instant' });
  }
  updateProgress();
});
motionPreference.addEventListener('change', e => { if (userReduced === null) { reduced = e.matches; setupAnimations(); } });

// Native links remain useful in the non-script version; account for pinned sections here.
$$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = $(link.getAttribute('href')); if (!target) return;
  event.preventDefault();
  let top = smoother ? smoother.offset(target, 'top top') : target.getBoundingClientRect().top + scrollY;
  if (target.id === 'top' && heroTrigger) top = heroTrigger.start;
  history.replaceState(null, '', link.getAttribute('href'));
  if (smoother) smoother.scrollTo(Math.max(0, top), true);
  else scrollTo({ top: Math.max(0, top), behavior: reduced ? 'instant' : 'smooth' });
  if (target.id === 'main') target.focus({ preventScroll: true });
}));

/* ========================================================
   Custom Swiss Interactive Cursor
   ======================================================== */
function setupCursor() {
  const dot = $('.swiss-cursor-dot');
  const ring = $('.swiss-cursor-ring');
  const label = $('.swiss-cursor-ring .cursor-label');
  if (!dot || !ring || !matchMedia('(pointer: fine)').matches) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  addEventListener('pointermove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
  }, { passive: true });

  const renderCursor = () => {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(renderCursor);
  };
  requestAnimationFrame(renderCursor);

  document.addEventListener('mouseover', e => {
    const target = e.target.closest('a, button, .project-card, .gallery-window, .solutions-track, .reviews-wall, summary');
    const overReviews = target?.closest('.reviews-wall');
    const overCard = target?.closest('.solutions-track, .project-card, .gallery-window, .reviews-wall');
    dot.classList.toggle('cursor-card-active', Boolean(overCard));
    if (!target) {
      ring.className = 'swiss-cursor-ring';
      if (label) label.textContent = '';
      return;
    }
    if (overCard) {
      ring.className = `swiss-cursor-ring cursor-card${overReviews ? ' cursor-reviews' : ''}`;
      if (label) label.textContent = overReviews ? 'ЛИСТАТЬ' : '↗';
    } else {
      ring.className = 'swiss-cursor-ring cursor-hover';
      if (label) label.textContent = '';
    }
  });

  document.addEventListener('mouseleave', () => {
    dot.classList.add('cursor-hidden');
    ring.classList.add('cursor-hidden');
  });
  document.addEventListener('mouseenter', () => {
    dot.classList.remove('cursor-hidden');
    ring.classList.remove('cursor-hidden');
  });
}

/* ========================================================
   Card 3D Tilt Effect
   ======================================================== */
function setupCardTilt() {
  if (!matchMedia('(pointer: fine)').matches) return;
  $$('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      if (reduced || card.closest('.is-dragging')) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tilt-y', `${x * 5}deg`);
      card.style.setProperty('--tilt-x', `${-y * 5}deg`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--tilt-x');
    });
  });
}

/* ========================================================
   Astrakhan Live Clock & Copy to Clipboard
   ======================================================== */
function setupClock() {
  function tick() {
    try {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(now);
      $$('.ast-clock').forEach(el => el.textContent = `${timeStr} UTC+3`);
    } catch {}
  }
  setInterval(tick, 1000);
  tick();
}

function setupCopyClipboard() {
  const toast = $('#copy-toast');
  let timer;
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        if (toast) {
          toast.textContent = `✓ ${text} скопирован в буфер!`;
          toast.classList.add('toast-show');
          clearTimeout(timer);
          timer = setTimeout(() => toast.classList.remove('toast-show'), 2500);
        }
      } catch {
        location.href = `mailto:${text}`;
      }
    });
  });
}

// Import failure or lack of WebGL never hides the page or its links.
async function init() {
  try {
    const { createScene } = await import(document.documentElement.dataset.theme === 'dark' ? './scene-dark.js' : './scene.js');
    scene = createScene($('#webgl'), reduced);
    document.documentElement.classList.add('webgl-ready');
  } catch (error) {
    document.documentElement.classList.add('webgl-unavailable');
    console.warn('3D unavailable; the complete static page remains available.', error.message);
  }
  setupSolutionsCarousel();
  setupProjectGallery();
  setupProcessAccordion();
  setupFAQ();
  updateReviewsMotion = setupReviews(() => reduced);
  setupAnimations();
  updateActiveMenu();
  if (window.gsap) window.gsap.ticker.add(updateActiveMenu);
  else addEventListener('scroll', updateActiveMenu, { passive: true });
  addEventListener('resize', updateActiveMenu, { passive: true });
  setupCursor();
  setupCardTilt();
  setupClock();
  setupCopyClipboard();
  await document.fonts.ready;
  window.ScrollTrigger?.refresh();
  updateProgress();
  // Project images have reserved dimensions; loading them does not change layout
  // and must not rebuild the pinned hero while the gallery is being scrolled.
}

if (document.readyState === 'complete') init(); else addEventListener('load', init, { once: true });
addEventListener('pagehide', e => { if (!e.persisted) { scene?.dispose(); animationContext?.revert(); smoother?.kill(); } });
