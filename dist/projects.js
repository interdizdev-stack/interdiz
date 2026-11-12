import { projects } from './project-data.js';
import { setupCasePresentation } from './case-presentation.js';

export function setupProjectDialog({ onOpen } = {}) {
  const dialog = document.querySelector('.project-dialog:not(.service-dialog)');
  if (!dialog) return;
  const title = dialog.querySelector('#dialog-title');
  const description = dialog.querySelector('.dialog-description');
  const gallery = dialog.querySelector('[data-project-gallery]');
  const stack = dialog.querySelector('.case-stack');
  const toolbar = dialog.querySelector('.project-case-toolbar');
  toolbar.append(stack);
  const pageLink = dialog.querySelector('.dialog-project-page');
  const link = dialog.querySelector('.dialog-link');
  let opener;
  let restorePage;
  let disposePresentation;

  document.querySelectorAll('[data-open-project]').forEach(button => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', event => {
      if (event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const project = projects.find(project => project.key === button.dataset.openProject);
      if (!project || dialog.open) return;
      event.preventDefault();

      opener = button;
      title.textContent = project.title;
      description.textContent = project.description;
      stack.replaceChildren(...project.stack.map(item => {
        const tag = document.createElement('li');
        tag.textContent = item;
        return tag;
      }));
      if (project.presentation) {
        const frame = document.createElement('iframe');
        frame.className = 'case-presentation-frame';
        frame.title = `Презентация проекта ${project.title}`;
        frame.src = `./${project.presentation}`;
        disposePresentation = setupCasePresentation(frame);
        gallery.replaceChildren(frame);
      } else gallery.replaceChildren(...project.images.map((sheet, index) => {
        const original = document.createElement('a');
        original.className = 'case-sheet';
        original.href = `./${sheet.src}`;
        original.target = '_blank';
        original.rel = 'noopener';
        original.setAttribute('aria-label', `${project.title}: лист ${index + 1} из ${project.images.length}, открыть оригинал`);
        const image = document.createElement('img');
        image.src = original.href;
        image.alt = `${project.title} — презентация проекта, лист ${index + 1} из ${project.images.length}`;
        image.width = sheet.width;
        image.height = sheet.height;
        image.loading = index === 0 ? 'eager' : 'lazy';
        image.decoding = 'async';
        original.append(image);
        return original;
      }));
      if (project.key === 'mama') {
        const frame = document.createElement('iframe');
        frame.className = 'mama-mobile-presentation';
        frame.title = 'Мобильная презентация проекта Я — мама';
        frame.src = './assets/cases/mama/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      if (project.key === 'poplavok') {
        const frame = document.createElement('iframe');
        frame.className = 'poplavok-mobile-presentation';
        frame.title = 'Мобильная презентация проекта Поплавок';
        frame.src = './assets/cases/poplavok/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      if (project.key === 'health') {
        const frame = document.createElement('iframe');
        frame.className = 'health-mobile-presentation';
        frame.title = 'Мобильная презентация проекта Health Culture';
        frame.src = './assets/cases/health/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      if (project.key === 'pierre-magnol') {
        const frame = document.createElement('iframe');
        frame.className = 'pierre-mobile-presentation';
        frame.title = 'Мобильная презентация проекта Pierre Magnol';
        frame.src = './assets/cases/pierre-magnol/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      if (project.key === 'home30') {
        const frame = document.createElement('iframe');
        frame.className = 'home30-mobile-presentation';
        frame.title = 'Мобильная презентация проекта HOME30';
        frame.src = './assets/cases/home30/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      if (project.key === 'shogun-auto') {
        const frame = document.createElement('iframe');
        frame.className = 'shogun-mobile-presentation';
        frame.title = 'Мобильная презентация проекта Shogun Auto';
        frame.src = './assets/cases/shogun-auto/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      if (project.key === 'kyrilka') {
        const frame = document.createElement('iframe');
        frame.className = 'kyrilka-mobile-presentation';
        frame.title = 'Мобильная презентация проекта Kyrilka';
        frame.src = './assets/cases/kyrilka/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      if (project.key === 'ivan-grozny') {
        const frame = document.createElement('iframe');
        frame.className = 'ivan-mobile-presentation';
        frame.title = 'Мобильная презентация проекта Иван Грозный — Перезагрузка';
        frame.src = './assets/cases/ivan-grozny/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      if (project.key === 'divo-dental') {
        const frame = document.createElement('iframe');
        frame.className = 'divo-mobile-presentation';
        frame.title = 'Мобильная презентация проекта Divo Dental';
        frame.src = './assets/cases/divo-dental/mobile.htm';
        frame.loading = 'lazy';
        disposePresentation = setupCasePresentation(frame);
        gallery.append(frame);
      }
      pageLink.href = `./${project.page}`;
      if (link) {
        link.hidden = !project.behance;
        link.href = project.behance || '#';
      }

      restorePage = onOpen?.();
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('dialog-open');
    });
  });

  dialog.querySelectorAll('.dialog-close, [data-close-project]').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    restorePage?.();
    restorePage = null;
    opener?.focus({ preventScroll: true });
    opener = null;
    disposePresentation?.();
    disposePresentation = null;
    gallery.replaceChildren();
  });
}
