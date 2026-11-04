import { setupProjectDialog } from './projects.js';

setupProjectDialog();

const controls = document.querySelector('.portfolio-toolbar');
const filters = [...controls.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.portfolio-grid .project-card')];
const count = controls.querySelector('.portfolio-count');
const themeSwitch = document.querySelector('.theme-switch');

filters.forEach(button => {
  const total = cards.filter(card => button.dataset.filter === 'all' || card.dataset.topic === button.dataset.filter).length;
  const badge = document.createElement('span');
  badge.className = 'portfolio-filter-count';
  badge.textContent = total;
  badge.setAttribute('aria-hidden', 'true');
  button.append(badge);
});

function showTopic(topic) {
  let visible = 0;
  cards.forEach(card => {
    card.hidden = topic !== 'all' && card.dataset.topic !== topic;
    if (!card.hidden) visible += 1;
  });
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === topic)));
  count.textContent = `Показано ${visible} из ${cards.length}`;
}

const url = new URL(location.href);
const initialTopic = filters.find(button => button.dataset.filter === url.searchParams.get('topic'));
showTopic(initialTopic?.dataset.filter ?? 'all');
controls.hidden = false;

filters.forEach(button => button.addEventListener('click', () => {
  const topic = button.dataset.filter;
  showTopic(topic);
  if (topic === 'all') url.searchParams.delete('topic');
  else url.searchParams.set('topic', topic);
  history.replaceState(history.state, '', url);

  const themeUrl = new URL(themeSwitch.href);
  if (topic === 'all') themeUrl.searchParams.delete('topic');
  else themeUrl.searchParams.set('topic', topic);
  themeSwitch.href = themeUrl.href;
}));
