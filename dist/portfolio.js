import { setupProjectDialog } from './projects.js';

setupProjectDialog();

const controls = document.querySelector('.portfolio-toolbar');
const topicButtons = [...controls.querySelectorAll('[data-filter]')];
const categoryButtons = [...controls.querySelectorAll('[data-category]')];
const cards = [...document.querySelectorAll('.portfolio-grid .project-card')];
const count = controls.querySelector('.portfolio-count');
const reset = controls.querySelector('[data-reset-filters]');
const empty = document.querySelector('.portfolio-empty');
const themeSwitch = document.querySelector('.theme-switch');
const selected = { category: 'all', topic: 'all' };
const groups = [
  { key: 'category', buttons: categoryButtons, value: button => button.dataset.category },
  { key: 'topic', buttons: topicButtons, value: button => button.dataset.filter }
];

function matches(card, category, topic) {
  return (category === 'all' || card.dataset.categories.split(' ').includes(category)) &&
    (topic === 'all' || card.dataset.topic === topic);
}

groups.forEach(group => group.buttons.forEach(button => {
  const badge = document.createElement('span');
  badge.className = 'portfolio-filter-count';
  badge.setAttribute('aria-hidden', 'true');
  button.append(badge);
}));

function render() {
  let visible = 0;
  cards.forEach(card => {
    card.hidden = !matches(card, selected.category, selected.topic);
    if (!card.hidden) visible += 1;
  });
  groups.forEach(group => group.buttons.forEach(button => {
    const value = group.value(button);
    button.setAttribute('aria-pressed', String(value === selected[group.key]));
    const category = group.key === 'category' ? value : selected.category;
    const topic = group.key === 'topic' ? value : selected.topic;
    button.querySelector('.portfolio-filter-count').textContent = cards.filter(card => matches(card, category, topic)).length;
  }));
  count.textContent = `Показано ${visible} из ${cards.length}`;
  reset.hidden = selected.category === 'all' && selected.topic === 'all';
  empty.hidden = visible !== 0;

  // Keep both selections when changing the colour theme.
  const themeUrl = new URL(themeSwitch.href);
  groups.forEach(({ key }) => {
    if (selected[key] === 'all') themeUrl.searchParams.delete(key);
    else themeUrl.searchParams.set(key, selected[key]);
  });
  themeSwitch.href = themeUrl.href;
}

function readURL() {
  const url = new URL(location.href);
  groups.forEach(group => {
    const value = url.searchParams.get(group.key);
    selected[group.key] = group.buttons.some(button => group.value(button) === value) ? value : 'all';
  });
  render();
}

function updateURL() {
  const url = new URL(location.href);
  groups.forEach(({ key }) => {
    if (selected[key] === 'all') url.searchParams.delete(key);
    else url.searchParams.set(key, selected[key]);
  });
  history.replaceState(history.state, '', url);
  render();
}

groups.forEach(group => group.buttons.forEach(button => button.addEventListener('click', () => {
  selected[group.key] = group.value(button);
  updateURL();
})));

document.querySelectorAll('[data-reset-filters]').forEach(button => button.addEventListener('click', () => {
  selected.category = selected.topic = 'all';
  updateURL();
  categoryButtons[0].focus({ preventScroll: true });
}));

window.addEventListener('popstate', readURL);
readURL();
controls.hidden = false;
