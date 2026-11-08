import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { projects, categoryLabels } from '../dist/project-data.js';
import { pages } from '../seo.config.mjs';
import { absolute, extractCaseImages, textContent } from './sync-seo.mjs';

const root = new URL('../dist/', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const imported = JSON.parse(await readFile(new URL('../docs/import/interdiz-cases.json', import.meta.url), 'utf8'));

test('all source cases and every original presentation sheet have been imported', async () => {
  assert.equal(imported.projects.length, 9);
  assert.equal(projects.length, imported.projects.length);
  assert.equal(new Set(projects.map(project => project.sourceId)).size, projects.length);
  assert.equal(projects.reduce((sum, project) => sum + project.images.length, 0), 105);
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
