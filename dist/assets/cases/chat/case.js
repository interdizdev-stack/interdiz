const picker = document.querySelector('.theme-picker');
const workspace = document.querySelector('#theme-workspace');
const choices = picker.querySelectorAll('[data-theme-choice]');

for (const button of choices) {
  button.addEventListener('click', () => {
    const theme = button.dataset.themeChoice;
    workspace.src = `assets/application-${theme}.png`;
    workspace.alt = button.textContent + ' тема рабочего пространства чата, снимок QA-среды';
    for (const choice of choices) choice.setAttribute('aria-pressed', String(choice === button));
  });
}
picker.hidden = false;

// The case iframe spans the whole presentation. Open the image in the visible site viewport.
const viewerTemplate = document.querySelector('#screenshot-viewer');
for (const link of document.querySelectorAll('.screenshot-button')) {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const host = window.frameElement?.ownerDocument ?? document;
    const viewer = viewerTemplate.content.querySelector('dialog').cloneNode(true);
    viewer.querySelector('link').href = new URL('viewer.css', document.baseURI).href;
    viewer.querySelector('p').textContent = link.dataset.title;
    viewer.querySelector('a').href = link.href;
    const image = viewer.querySelector('img');
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    host.body.append(viewer);
    viewer.showModal();
    event.preventDefault();
    viewer.addEventListener('click', e => {
      if (e.target === viewer) viewer.close();
    });
    viewer.addEventListener('close', () => {
      viewer.remove();
      link.focus({ preventScroll: true });
    }, { once: true });
  });
}
