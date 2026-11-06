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
    catalogName: 'Форматы сайтов', serviceType: 'Разработка сайтов и веб-приложений',
  },
  {
    file: 'design.html', path: 'design.html', kind: 'service', name: 'Дизайн',
    title: 'Дизайн: фирменный стиль, интерфейсы и презентации — InterDIZ',
    description: 'Фирменный стиль, дизайн сайтов и интерфейсов, презентации и материалы для бизнеса. От визуальной концепции до готовых макетов и исходников в InterDIZ.',
    image: 'assets/health-culture.webp', imageAlt: 'Фирменный стиль Health Culture — проект InterDIZ',
    faqSection: 'questions', projectSection: 'work', catalogName: 'Направления дизайна',
  },
  {
    file: 'ai-assistants.html', path: 'ai-assistants.html', kind: 'service', name: 'ИИ-боты и ассистенты',
    title: 'ИИ-боты и ассистенты для бизнеса — InterDIZ',
    description: 'Создаём ИИ-ботов и ассистентов: ответы по базе знаний компании, приём обращений и поиск информации для сотрудников. Сценарии, интеграции и проверка качества.',
    image: 'assets/og-ai.png', imageAlt: 'InterDIZ — ИИ-боты и ассистенты: знания компании в диалоге',
    faqSection: 'questions', catalogName: 'Сценарии ИИ-ассистентов',
  },
  {
    file: 'automation-crm.html', path: 'automation-crm.html', kind: 'service', name: 'Автоматизация и CRM',
    title: 'Автоматизация процессов и интеграции CRM — InterDIZ',
    description: 'Связываем сайт, CRM и рабочие сервисы. Настраиваем передачу заявок, документы и уведомления. Разбор процессов, проверка интеграций и инструкции для команды.',
    image: 'assets/og-crm.png', imageAlt: 'InterDIZ — автоматизация и CRM: связанные процессы и сервисы',
    faqSection: 'questions', catalogName: 'Направления автоматизации',
  },
  {
    file: 'seo.html', path: 'seo.html', kind: 'service', name: 'SEO-продвижение',
    title: 'SEO-продвижение и оптимизация сайта — InterDIZ',
    description: 'SEO для бизнеса по всей России: технический аудит, поисковые запросы, структура и содержание страниц. Внедрение улучшений и оценка результатов по аналитике.',
    image: 'assets/og-seo.png', imageAlt: 'InterDIZ — SEO-продвижение: структура, контент и поиск',
    faqSection: 'questions', catalogName: 'Работы по SEO-продвижению',
  },
  {
    file: 'yandex-direct.html', path: 'yandex-direct.html', kind: 'service', name: 'Яндекс.Директ',
    title: 'Настройка и ведение рекламы в Яндекс.Директе — InterDIZ',
    description: 'Реклама в Яндекс.Директе: аудит предложения, подготовка кампаний и объявлений, отслеживание обращений и ведение. Согласуем бюджет и оцениваем качество заявок.',
    image: 'assets/og-ads.png', imageAlt: 'InterDIZ — Яндекс.Директ: от объявления до обращения',
    faqSection: 'questions', catalogName: 'Работы с Яндекс.Директом',
  },
  {
    file: 'website-support.html', path: 'website-support.html', kind: 'service', name: 'Поддержка сайта',
    title: 'Поддержка и доработка сайтов — InterDIZ',
    description: 'Техническая поддержка сайта: обновления, исправление ошибок, резервное копирование и доработки. Проверка форм, доступности и понятный порядок работы с задачами.',
    image: 'assets/og-support.png', imageAlt: 'InterDIZ — поддержка сайта: обновления, стабильность и развитие',
    faqSection: 'questions', catalogName: 'Задачи поддержки сайта',
  },
];
