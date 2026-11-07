// Shared dialog interactions for the home page and inner pages.
export function setupMobileMenu({ menu, toggles, compactMedia, onOpen, onLayoutChange }) {
  if (!menu) return () => {};
  let opener;
  menu.hidden = false;

  const close = (restoreFocus = true) => {
    if (!restoreFocus) opener = null;
    if (menu.open) menu.close();
  };
  const sync = () => {
    const compact = compactMedia.matches;
    toggles.forEach(button => { button.hidden = !compact; });
    if (!compact) close(false);
    onLayoutChange?.(compact);
  };

  toggles.forEach(button => button.addEventListener('click', () => {
    if (!compactMedia.matches) return;
    opener = button;
    onOpen?.();
    menu.showModal();
    menu.scrollTop = 0;
    toggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'true'));
    document.body.classList.add('dialog-open');
  }));
  menu.querySelector('.mobile-menu-close').addEventListener('click', () => close());
  menu.addEventListener('click', event => {
    if (event.target.closest('a[href]') &&
        !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) close(false);
    if (event.target !== menu) return;
    const bounds = menu.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  });
  menu.addEventListener('close', () => {
    toggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    opener?.focus({ preventScroll: true });
    opener = null;
  });
  compactMedia.addEventListener('change', sync);
  sync();
  return close;
}

export function setupScrollProgress(readPosition = () => scrollY) {
  const shortcut = document.querySelector('.quick-home');
  const bar = document.querySelector('.scroll-progress > span');
  const root = document.documentElement;

  function update() {
    const range = root.scrollHeight - root.clientHeight;
    const fraction = range > 0 ? Math.max(0, Math.min(1, readPosition() / range)) : 0;
    shortcut?.style.setProperty('--page-progress', `${fraction * 100}%`);
    if (bar) bar.style.transform = `scaleX(${fraction})`;
  }

  new ResizeObserver(update).observe(document.body);
  addEventListener('resize', update);
  addEventListener('pageshow', update);
  update();
  return update;
}

// Inner pages use native scrolling rather than the home page's GSAP timeline.
export function setupPageNavigation() {
  const rememberHomeReturn = () => {
    const target = document.body.classList.contains('portfolio-page') ? 'projects'
      : document.body.classList.contains('service-page') ? 'services' : null;
    try {
      if (target) sessionStorage.setItem('interdiz-home-return', target);
      else sessionStorage.removeItem('interdiz-home-return');
    } catch {}
  };
  rememberHomeReturn();
  addEventListener('pageshow', rememberHomeReturn);
  const floatingNav = document.querySelector('#floating-nav');
  const updateProgress = setupScrollProgress();
  const mobileMenu = document.querySelector('#mobile-menu');
  const compactMedia = matchMedia('(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)');
  setupMobileMenu({
    menu: mobileMenu,
    toggles: [...document.querySelectorAll('[data-mobile-menu]')],
    compactMedia
  });

  function updateFloatingNavigation() {
    const visible = scrollY > 260 || mobileMenu.open || floatingNav.contains(document.activeElement);
    floatingNav.classList.toggle('visible', visible);
    floatingNav.inert = !visible;
    floatingNav.setAttribute('aria-hidden', String(!visible));
  }
  addEventListener('scroll', updateFloatingNavigation, { passive: true });
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateFloatingNavigation, { passive: true });
  addEventListener('pageshow', updateFloatingNavigation);
  floatingNav.addEventListener('focusout', () => requestAnimationFrame(updateFloatingNavigation));
  mobileMenu.addEventListener('close', updateFloatingNavigation);
  updateFloatingNavigation();
}
