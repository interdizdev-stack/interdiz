import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { projects, categoryLabels } from '../dist/project-data.js';
import { pages } from '../seo.config.mjs';
import { setupCasePresentation } from '../dist/case-presentation.js';
import { absolute, extractCaseImages, textContent } from './sync-seo.mjs';

const root = new URL('../dist/', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const imported = JSON.parse(await readFile(new URL('../docs/import/interdiz-cases.json', import.meta.url), 'utf8'));

test('all source cases and every original presentation sheet have been imported', async () => {
  assert.equal(imported.projects.length, 9);
  assert.equal(projects.length, imported.projects.length + 6);
  assert.equal(new Set(projects.map(project => project.sourceId)).size, projects.length);
  assert.equal(projects.filter(project => imported.projects.some(source => source.id === project.sourceId)).reduce((sum, project) => sum + project.images.length, 0), 105);
  for (const source of imported.projects) {
    const project = projects.find(project => project.sourceId === source.id);
    assert.ok(project, `missing source case ${source.id}`);
    assert.equal(project.description, source.description);
    assert.deepEqual(project.stack, source.stack);
    assert.equal(project.behance, source.beurl);
    assert.deepEqual(project.images.map(image => image.src.split('/').at(-1)), source.images, 'preserve source order');
    const html = await read(project.page);
    const images = extractCaseImages(html);
    assert.deepEqual(images.map(image => image.contentUrl), project.images.map(image => absolute(image.src)));
    assert.deepEqual(images.map(({width,height}) => ({width,height})), project.images.map(({width,height}) => ({width,height})));
    assert.ok(textContent(html).includes(textContent(project.description)));
    for (const technology of source.stack) assert.ok(textContent(html).includes(technology));
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1])['@graph'];
    const work = graph.find(entity => entity['@type'] === 'CreativeWork');
    assert.equal(work.name, project.title);
    assert.equal(work.description, textContent(project.description));
    assert.deepEqual(work.image, images);
    assert.deepEqual(work.keywords, source.stack);
    assert.ok(pages.some(page => page.kind === 'case' && page.file === project.page));
  }
});

test('MOCHI MOOD is reachable from both project lists and keeps its interactive presentation', async () => {
  const project = projects.find(item => item.key === 'mochi-mood');
  assert.ok(project);
  const page = await read(project.page);
  const presentation = await read(project.presentation);
  const styles = await read('assets/cases/mochi-mood/case.css');
  const behavior = await read('assets/cases/mochi-mood/case.js');
  assert.match(page, /data-case-frame data-case-key="mochi-mood"/);
  assert.match(presentation, /data-case-content/);
  assert.match(presentation, /id="sample-tray"/);
  assert.match(presentation, /id="motion-range"/);
  assert.match(presentation, /site-scroll-hq\.gif/);
  assert.doesNotMatch(presentation, /127\.0\.0\.1|localhost/);
  assert.match(styles, /\.is-embedded \.cover\{min-height:800px\}/);
  assert.match(behavior, /showBox\(6\)/);
  assert.deepEqual(extractCaseImages(page).map(image => image.contentUrl), project.images.map(image => absolute(image.src)));
  for (const file of ['index.html', 'portfolio.html']) {
    assert.match(await read(file), /data-open-project="mochi-mood"[^>]+href="\.\/case-mochi-mood\.html"/);
  }
});

test('114 local images match the imported originals byte for byte', async () => {
  assert.equal(imported.assets.length, 114);
  assert.equal(new Set(imported.assets.map(asset => asset.file)).size, 114);
  for (const asset of imported.assets) {
    const bytes = await readFile(new URL(asset.file, root));
    assert.equal(bytes.length, asset.bytes, asset.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
});

test('CHAT opens one responsive presentation with its original typefaces from both galleries', async () => {
  const project = projects.find(item => item.key === 'chat');
  assert.deepEqual(project.categories, ['automation', 'ai']);
  const page = await read(project.page);
  for (const category of project.categories) {
    assert.ok(page.includes(`href="./portfolio.html?category=${category}#portfolio-catalog"`));
  }
  assert.ok(page.includes(`data-case-key="chat" src="./${project.presentation}"`));
  assert.deepEqual(extractCaseImages(page).map(image => image.contentUrl), project.images.map(image => absolute(image.src)));
  for (const file of ['index.html', 'portfolio.html']) {
    assert.match(await read(file), /data-open-project="chat"[^>]+href="\.\/case-chat\.html"/);
  }
  const presentation = await read(project.presentation);
  assert.match(presentation, /data-case-content/);
  assert.equal((presentation.match(/<section\b/g) || []).length, 9);
  const styles = await read('assets/cases/chat/case.css');
  for (const family of ['manrope', 'oswald']) {
    const font = `assets/${family}.woff2`;
    assert.ok(styles.includes(`url('${font}')`));
    const bytes = await readFile(new URL(`assets/cases/chat/${font}`, root));
    assert.equal(bytes.toString('ascii', 0, 4), 'wOF2');
  }
});

test('catalog categories and ordinary links reach every full case without JavaScript', async () => {
  const html = await read('portfolio.html');
  const cards = [...html.matchAll(/<article class="project-card"([^>]*)>([^]*?)<\/article>/g)];
  assert.equal(cards.length, projects.length);
  for (const [attrs, content] of cards.map(card => [card[1], card[2]])) {
    const key = content.match(/data-open-project="([^"]+)"/)[1];
    const project = projects.find(project => project.key === key);
    assert.ok(project);
    assert.match(attrs, new RegExp(`id="project-${key}"`));
    assert.equal(attrs.match(/data-categories="([^"]+)"/)[1], project.categories.join(' '));
    assert.match(content, new RegExp(`<a[^>]+data-open-project="${key}"[^>]+href="\\./${project.page}"`));
    for (const category of project.categories) {
      assert.ok(categoryLabels[category]);
      assert.ok(html.includes(`data-category="${category}"`));
    }
  }
  for (const file of ['index.html', 'web-development.html', 'design.html']) {
    const source = await read(file);
    for (const link of source.matchAll(/<a[^>]+data-open-project="([^"]+)"[^>]+href="([^"]+)"/g)) {
      assert.equal(link[2], `./${projects.find(project => project.key === link[1]).page}`);
    }
    assert.match(source, /data-project-gallery/);
    assert.match(source, /href="\.\/cases\.css"/);
  }
});


test('NOS case links the animated cover and the full presentation', async () => {
  const project = projects.find(project => project.key === 'nos');
  assert.ok(project);
  assert.deepEqual(project.categories, ['web', 'identity']);
  const page = await read(project.page);
  const presentation = await read(project.presentation);
  assert.match(page, /data-case-frame data-case-key="nos"/);
  assert.match(presentation, /Разработка логотипа и сайта/);
  assert.match(presentation, /nos-brand-card-contacts\.png/);
  assert.match(presentation, /data-opening-animation="assets\/nos-site-opening-once\.gif"/);
  assert.deepEqual(extractCaseImages(page).map(image => image.contentUrl), project.images.map(image => absolute(image.src)));
  for (const file of ['index.html', 'portfolio.html']) {
    const html = await read(file);
    assert.match(html, /data-open-project="nos"/);
    assert.match(html, /assets\/cases\/nos\/preview\.gif/);
  }
});


test('AMI case keeps the approved presentation and opens from both project lists', async () => {
  const project = projects.find(project => project.key === 'ami');
  assert.ok(project);
  assert.deepEqual(project.categories, ['web']);
  const page = await read(project.page);
  const presentation = await read(project.presentation);
  assert.match(page, /data-case-frame data-case-key="ami"/);
  assert.match(page, /href="https:\/\/fotoami\.ru\/"/);
  assert.match(presentation, /Наталья Груничева/);
  assert.match(presentation, /WooCommerce/);
  assert.doesNotMatch(presentation, /прототип|демонстрационная концепция/i);
  for (const name of ['hero-snap-loop-hq.webp', 'site-scroll-hq.webp', 'mobile-scroll-hq.webp', 'mobile-catalog.png', 'mobile-product.png']) {
    assert.ok(presentation.includes(`assets/${name}`), name);
    assert.ok((await readFile(new URL(`assets/cases/ami/assets/${name}`, root))).length > 0);
  }
  assert.deepEqual(extractCaseImages(page).map(image => image.contentUrl), project.images.map(image => absolute(image.src)));
  for (const file of ['index.html', 'portfolio.html']) {
    assert.match(await read(file), /data-open-project="ami"[^>]+href="\.\/case-ami\.html"/);
  }
});

test('embedded case resizes to its contents and releases its observer', () => {
  const originalObserver = globalThis.ResizeObserver;
  let onLoad, onResize, disconnected = false;
  const body = { scrollHeight: 1800 };
  let content;
  const documentElement = { scrollHeight: 1700 };
  const childWindow = { location: { href: 'http://example.test/case' }, addEventListener() {}, removeEventListener() {} };
  const frame = {
    style: {}, contentDocument: { body, documentElement, querySelector: () => content, readyState: 'loading' }, contentWindow: childWindow,
    addEventListener(type, cb) { if (type === 'load') onLoad = cb; },
    removeEventListener() {}
  };
  globalThis.ResizeObserver = class { constructor(callback) { onResize = callback; } observe(element) { assert.equal(element, content || body); } disconnect() { disconnected = true; } };
  try {
    const dispose = setupCasePresentation(frame);
    onLoad();
    assert.equal(frame.style.height, '1800px');
    body.scrollHeight = 2100;
    onResize();
    assert.equal(frame.style.height, '2100px');
    let contentHeight = 2001.2;
    content = { getBoundingClientRect: () => ({ height: contentHeight }) };
    onLoad();
    assert.equal(frame.style.height, '2002px');
    contentHeight = 1200;
    onResize();
    assert.equal(frame.style.height, '1200px');
    dispose();
    assert.ok(disconnected);
  } finally { globalThis.ResizeObserver = originalObserver; }
});


test('SHUM case preserves the approved animated presentation and opens from both project lists', async () => {
  const project = projects.find(project => project.key === 'shum');
  assert.ok(project);
  assert.deepEqual(project.categories, ['web']);
  const page = await read(project.page);
  const presentation = await read(project.presentation);
  assert.match(page, /data-case-frame data-case-key="shum"/);
  assert.match(presentation, /SHUM-scroll-highquality\.webp/);
  assert.match(presentation, /ШУМ/);
  assert.deepEqual(extractCaseImages(page).map(image => image.contentUrl), project.images.map(image => absolute(image.src)));
  for (const file of ['index.html','portfolio.html']) assert.match(await read(file), /data-open-project="shum"[^>]+href="\.\/case-shum\.html"/);
});


test('VIAR case preserves the approved presentation and opens from both project lists', async () => {
  const project = projects.find(project => project.key === 'viar');
  assert.ok(project);
  assert.deepEqual(project.categories, ['web', 'identity', 'automation']);
  const page = await read(project.page);
  const presentation = await read(project.presentation);
  assert.match(page, /data-case-frame data-case-key="viar"/);
  assert.match(page, /href="https:\/\/viar-tver\.ru\/"/);
  assert.match(presentation, /Вадим Игоревич/);
  assert.match(presentation, /Клиент продолжает работать с нами: мы создаём/);
  assert.match(presentation, /viar-home-scroll\.gif/);
  assert.match(presentation, /identity-entrance\.webp/);
  assert.deepEqual(extractCaseImages(page).map(image => image.contentUrl), project.images.map(image => absolute(image.src)));
  for (const file of ['index.html', 'portfolio.html']) assert.match(await read(file), /data-open-project="viar"[^>]+href="\.\/case-viar\.html"/);
});
