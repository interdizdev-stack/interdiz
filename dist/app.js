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
const pageScroll = () => smoother?.scrollTop() ?? scrollY;

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

// Keep native click/keyboard controls; reveal the current step while reading.
function setupProcessAccordion() {
  const list = $('#expertise .service-list');
  if (!list) return;
  const rows = $$('.service', list);
  let scrollFrame = 0;
  let layoutTimer = 0;
  let previousScroll = pageScroll();

  function openStep(row) {
    if (row.open) return;
    rows.forEach(other => { other.open = other === row; });
  }

  function revealOnScroll() {
    scrollFrame = 0;
    if (document.body.classList.contains('dialog-open')) return;
    // Keyboard users keep control of the step they are interacting with.
    if (list.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
    const readingLine = innerHeight * 0.55;
    const bounds = list.getBoundingClientRect();
    if (bounds.top > readingLine || bounds.bottom < 0) return;
    let current = rows[0];
    rows.forEach(row => {
      if ($('summary', row).getBoundingClientRect().top <= readingLine) current = row;
    });
    openStep(current);
  }

  rows.forEach(row => {
    row.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && matchMedia('(hover: hover)').matches) openStep(row);
    });
    row.addEventListener('toggle', () => {
      if (row.open) rows.forEach(other => { if (other !== row) other.open = false; });
      clearTimeout(layoutTimer);
      layoutTimer = setTimeout(() => {
        // Refresh only the sections below the steps. A global refresh would
        // unpin/rebuild the hero during the user's scroll.
        const triggers = window.ScrollTrigger?.getAll() ?? [];
        triggers.forEach(trigger => {
          if (!trigger.pin && trigger.trigger?.closest?.('.approach, .contact')) trigger.refresh();
        });
        updateProgress();
      }, 180);
    });
  });
  updateProcessOnScroll = () => {
    const position = pageScroll();
    if (Math.abs(position - previousScroll) < 1) return;
    previousScroll = position;
    if (!scrollFrame) scrollFrame = requestAnimationFrame(revealOnScroll);
  };
  addEventListener('scroll', updateProcessOnScroll, { passive: true });
  addEventListener('resize', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(revealOnScroll);
  });
  requestAnimationFrame(revealOnScroll);
}

function updateMotionButton() {
  const btn = $('.motion-toggle');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(reduced));
  btn.setAttribute('aria-label', reduced ? 'Включить анимации' : 'Уменьшить движение');
  $('.motion-icon').textContent = reduced ? '▷' : 'Ⅱ';
  $('.motion-label').textContent = reduced ? 'Включить анимации' : 'Меньше движения';
  document.documentElement.classList.toggle('reduced-motion', reduced);
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
  if (!window.gsap || !window.ScrollTrigger) return;
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

        gsap.fromTo('.projects-heading', { y: 32, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            id: 'projects-title-reveal',
            trigger: '.projects-heading',
            start: 'top 92%',
            once: true
          }
        });

        // Move the viewport as one ribbon; its native carousel coordinates stay intact.
        gsap.fromTo('.gallery-window', {
          x: () => Math.min(innerWidth * (mobile ? 0.35 : 0.24), mobile ? 200 : 360),
          opacity: 0
        }, {
          x: 0, opacity: 1,
          duration: 1.25, ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            id: 'projects-horizontal-reveal',
            trigger: '.gallery-window',
            start: 'top 82%',
            once: true,
            invalidateOnRefresh: true
          }
        });
      } else {
        gsap.from('.manifesto-line', { x: (i) => i % 2 ? 45 : -45, opacity: 0.2, stagger: 0.1, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: '.manifesto', start: 'top 85%', once: true } });
        gsap.from('.solution-card', { y: 45, rotationY: -8, transformPerspective: 1000, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.solutions-stage', start: 'top 90%', once: true } });
        gsap.from('.projects-heading', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.projects', start: 'top 85%', once: true } });
        gsap.from('.project-card', { y: 55, rotationY: -6, opacity: 0, transformPerspective: 1200, stagger: 0.14, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.gallery-window', start: 'top 90%', once: true } });
      }

      gsap.from('.service', { y: 35, opacity: 0, stagger: 0.08, duration: 0.65, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.service-list', start: 'top 92%', once: true } });
      gsap.from('.expertise h2', { y: 70, opacity: 0.2, scrollTrigger: { trigger: '.expertise', start: 'top 80%', end: 'top 25%', scrub: 0.6 } });
      gsap.from('.approach-line', { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.approach', start: 'top 85%', once: true } });
      gsap.from('.approach-card', { x: -18, opacity: 0, stagger: 0.1, duration: 0.65, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.approach-grid', start: 'top 90%', once: true } });
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
    const target = e.target.closest('a, button, .project-card, .gallery-window, .solutions-track, .service summary');
    const overCard = target?.closest('.solutions-track, .project-card, .gallery-window');
    dot.classList.toggle('cursor-card-active', Boolean(overCard));
    if (!target) {
      ring.className = 'swiss-cursor-ring';
      if (label) label.textContent = '';
      return;
    }
    if (overCard) {
      ring.className = 'swiss-cursor-ring cursor-card';
      if (label) label.textContent = '↗';
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
        timeZone: 'Europe/Samara',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(now);
      $$('.ast-clock').forEach(el => el.textContent = `${timeStr} UTC+4`);
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
  setupAnimations();
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
