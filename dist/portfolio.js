import { setupProjectDialog } from './projects.js';

setupProjectDialog();

const controls = document.querySelector('.portfolio-toolbar');
const categoryButtons = [...controls.querySelectorAll('[data-category]')];
const cards = [...document.querySelectorAll('.portfolio-grid .project-card')];
const count = controls.querySelector('.portfolio-count');
const reset = controls.querySelector('[data-reset-filters]');
const empty = document.querySelector('.portfolio-empty');
let selectedCategory = 'all';

function matches(card, category) {
  return category === 'all' || card.dataset.categories.split(' ').includes(category);
}

categoryButtons.forEach(button => {
  const badge = document.createElement('span');
  badge.className = 'portfolio-filter-count';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = cards.filter(card => matches(card, button.dataset.category)).length;
  button.append(badge);
});

function setCategoryParameter(url) {
  // Old shared links must not apply an invisible topic filter.
  url.searchParams.delete('topic');
  if (selectedCategory === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', selectedCategory);
  return url;
}

function render() {
  let visible = 0;
  cards.forEach(card => {
    card.hidden = !matches(card, selectedCategory);
    if (!card.hidden) visible += 1;
  });
  categoryButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.category === selectedCategory));
  });
  count.textContent = `Показано ${visible} из ${cards.length}`;
  reset.hidden = selectedCategory === 'all';
  empty.hidden = visible !== 0;
  history.replaceState(history.state, '', setCategoryParameter(new URL(location.href)));
}

function readURL() {
  const category = new URL(location.href).searchParams.get('category');
  selectedCategory = categoryButtons.some(button => button.dataset.category === category) ? category : 'all';
  render();
}

categoryButtons.forEach(button => button.addEventListener('click', () => {
  selectedCategory = button.dataset.category;
  render();
}));

document.querySelectorAll('[data-reset-filters]').forEach(button => button.addEventListener('click', () => {
  selectedCategory = 'all';
  render();
  categoryButtons[0].focus({ preventScroll: true });
}));

window.addEventListener('popstate', readURL);
readURL();
controls.hidden = false;
