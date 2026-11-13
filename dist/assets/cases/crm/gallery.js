const screens = [...document.querySelectorAll('a[data-caption]')];
const template = document.querySelector('#crm-viewer');

function openViewer(trigger) {
  // The presentation iframe is as tall as the case. Use the site's visible viewport.
  const host = window.frameElement?.ownerDocument ?? document;
  const viewer = template.content.querySelector('dialog').cloneNode(true);
  viewer.querySelector('link').href = new URL('viewer.css', document.baseURI).href;
  const image = viewer.querySelector('img');
  const stage = viewer.querySelector('.crm-viewer-stage');
  const zoom = viewer.querySelector('[data-zoom]');
  let index = screens.indexOf(trigger);

  function setZoom(enlarged) {
    stage.classList.toggle('is-zoomed', enlarged);
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.textContent = enlarged ? 'Уместить' : 'Увеличить';
    stage.scrollTo(0, 0);
  }

  function show(step) {
    index = (index + step + screens.length) % screens.length;
    const link = screens[index];
    const thumbnail = link.querySelector('img');
    image.alt = thumbnail.alt;
    image.src = link.href;
    stage.style.setProperty('--image-width', thumbnail.getAttribute('width') + 'px');
    viewer.querySelector('output').textContent = `${index + 1} / ${screens.length}`;
    viewer.querySelector('.crm-viewer-caption span').textContent = link.dataset.caption;
    viewer.querySelector('a').href = link.href;
    setZoom(false);
  }

  for (const button of viewer.querySelectorAll('[data-step]')) {
    button.addEventListener('click', () => show(Number(button.dataset.step)));
  }
  zoom.addEventListener('click', () => setZoom(!stage.classList.contains('is-zoomed')));
  image.addEventListener('click', () => zoom.click());
  viewer.addEventListener('keydown', event => {
    if (stage.classList.contains('is-zoomed')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      show(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  viewer.addEventListener('click', event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => {
    viewer.remove();
    trigger.focus({ preventScroll: true });
  }, { once: true });
  host.body.append(viewer);
  show(0);
  viewer.showModal();
}

for (const link of screens) {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    openViewer(link);
    event.preventDefault();
  });
}
