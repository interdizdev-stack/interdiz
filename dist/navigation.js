// Shared dialog interactions for the home page and portfolio.
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
