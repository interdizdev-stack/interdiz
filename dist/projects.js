const projects = {
  mama: { title: 'Я — мама', description: 'Лендинг и ASO-креативы для мобильного приложения. Мягкий визуальный язык, передающий заботу и эмоциональное доверие.', image: './assets/mama.webp' },
  poplavok: { title: 'Поплавок', description: 'Новая digital-глава ресторана у воды в Астрахани. Веб-дизайн, UX/UI, разработка на WordPress и интеграция Telegram / MAX.', image: './assets/poplavok.webp' },
  health: { title: 'Health Culture', description: 'Фирменный стиль с ощущением абсолютной чистоты. Логотип и брендбук, превращающие культуру здоровья в системный визуальный код.', image: './assets/health-culture.webp', link: 'https://www.behance.net/gallery/248062171/Health-Culture-design-with-a-sense-of-purity' },
  "pierre-magnol": {"title": "Pierre Magnol", "description": "Pierre Magnol — премиальный цветочный бутик, где флористика рассматривается как форма искусства", "image": "./assets/pierre-magnol.webp", "link": "https://www.behance.net/gallery/246354277/Pierre-Magnol-Digital-Storefront-Development"},
  "home30": {"title": "HOME30", "description": "Городская роскошь в черно-оранжевых тонах: разработка веб-сайта хостела HOME30", "image": "./assets/home30.webp", "link": "https://www.behance.net/gallery/246912169/Urban-Luxury-in-Black-Orange-Hostel-Website-Concept"},
  "shogun-auto": {"title": "Shogun Auto", "description": "С Востока на весь мир — фирменный стиль Shogun Auto", "image": "./assets/shogun-auto.webp", "link": "https://www.behance.net/gallery/246098169/From-East-to-World-Shogun-Auto-Brand-Identity"},
  "kyrilka": {"title": "Kyrilka", "description": "Kyrilka — контрастный дизайн для современной цифровой витрины", "image": "./assets/kyrilka.webp", "link": "https://www.behance.net/gallery/248739383/Kyrilka-Modern-E-commerce-Showcase"},
  "ivan-grozny": {"title": "Иван Грозный — Перезагрузка", "description": "Иван Грозный — когда история оживает: разработка ТВ-рекламы и афиш для регионального конкурса", "image": "./assets/ivan-grozny.webp"},
  "divo-dental": {"title": "Divo Dental", "description": "Divo Dental — разработка логотипа для современной стоматологии", "image": "./assets/divo-dental.webp", "link": "https://www.behance.net/gallery/249932083/The-Geometry-of-Trust-A-Logo-for-a-Modern-Dental-Brand"}
};

export function setupProjectDialog() {
  const dialog = document.querySelector('.project-dialog:not(.service-dialog)');
  const title = dialog.querySelector('#dialog-title');
  const description = dialog.querySelector('.dialog-description');
  const image = dialog.querySelector('.dialog-image');
  const link = dialog.querySelector('.dialog-link');
  const fallbackLink = link.getAttribute('href');
  const fallbackLabel = link.textContent;
  let opener;

  document.querySelectorAll('[data-open-project]').forEach(button => {
    button.addEventListener('click', () => {
      const project = projects[button.dataset.openProject];
      if (!project) return;

      opener = button;
      title.textContent = project.title;
      description.textContent = project.description;
      image.src = project.image;
      image.alt = `Проект ${project.title}`;
      const destination = project.link ?? fallbackLink;
      link.hidden = !destination;
      link.setAttribute('href', destination ?? '');
      link.textContent = project.link ? 'Смотреть кейс на Behance ↗' : fallbackLabel;
      if (project.link) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else {
        link.removeAttribute('target');
        link.removeAttribute('rel');
      }

      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('dialog-open');
    });
  });

  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    opener?.focus({ preventScroll: true });
  });
}
