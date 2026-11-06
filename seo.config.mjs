// Public production identity. Keep URLs independent of previews and theme/filter parameters.
export const site = {
  url: 'https://interdiz.ru/',
  name: 'InterDIZ',
  language: 'ru-RU',
  locale: 'ru_RU',
  areaServed: { '@type': 'Country', name: 'Россия', identifier: 'RU' },
};

// All public HTML pages must be registered: npm run check:seo detects missing entries.
// Visible content stays in dist/*.html; FAQ, services, projects and contacts are read from it.
export const pages = [
  {
    file: 'index.html', path: '', kind: 'home', name: 'Главная',
    title: 'InterDIZ — разработка сайтов, дизайн и продвижение',
    description: 'Студия InterDIZ: разработка сайтов и веб-приложений, дизайн, ИИ-боты, автоматизация и CRM, SEO, Яндекс.Директ и поддержка. От задачи до запуска.',
    image: 'assets/mama.webp', imageAlt: 'Проект студии InterDIZ — Я — мама',
    faqSection: 'approach', projectSection: 'projects',
  },
  {
    file: 'portfolio.html', path: 'portfolio.html', kind: 'portfolio', name: 'Портфолио',
    title: 'Портфолио InterDIZ — сайты, дизайн и рекламные проекты',
    description: 'Портфолио студии InterDIZ: сайты, фирменные стили и рекламные кампании. Проекты для разных отраслей, примеры дизайна и разработки.',
    image: 'assets/mama.webp', imageAlt: 'Проект студии InterDIZ — Я — мама',
    projectSection: 'portfolio-catalog',
  },
  {
    file: 'web-development.html', path: 'web-development.html', kind: 'service', name: 'Сайты и веб-приложения',
    title: 'Разработка сайтов и веб-приложений — InterDIZ',
    description: 'Разработка лендингов, корпоративных сайтов, интернет-магазинов и веб-приложений в InterDIZ. Структура, дизайн, интеграции и запуск. Этапы, проекты и ответы на вопросы.',
    image: 'assets/poplavok.webp', imageAlt: 'Дизайн сайта ресторана Поплавок — проект InterDIZ',
    faqSection: 'questions', projectSection: 'work',
  },
];
