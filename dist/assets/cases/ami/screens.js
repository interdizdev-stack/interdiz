const gallery = document.querySelector('#shop-screens');
const controls = document.querySelector('.screen-switch');
const compact = window.matchMedia('(max-width: 960px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const screens = Array.from(gallery.children);
const buttons = Array.from(controls.querySelectorAll('button'));

function distanceFromCenter(screen) {
  const item = screen.getBoundingClientRect();
  const track = gallery.getBoundingClientRect();
  return item.left + item.width / 2 - (track.left + track.width / 2);
}

function updateSelection() {
  if (!compact.matches) return;
  const distances = screens.map(screen => Math.abs(distanceFromCenter(screen)));
  const selected = distances.indexOf(Math.min(...distances));
  buttons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === selected));
  });
}

buttons.forEach((button, index) => {
  button.addEventListener('click', () => {
    gallery.scrollBy({
      left: distanceFromCenter(screens[index]),
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  });
});

function updateLayout() {
  controls.hidden = !compact.matches;
  updateSelection();
}

gallery.addEventListener('scroll', updateSelection, { passive: true });
window.addEventListener('resize', updateSelection);
compact.addEventListener('change', updateLayout);
updateLayout();
