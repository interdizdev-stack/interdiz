import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { pages, site } from '../seo.config.mjs';
import { absolute, extractFAQ, extractProjects, textContent, syncSEO } from './sync-seo.mjs';

const root = new URL('../dist/', import.meta.url);
const read = async file => (await readFile(new URL(file, root), 'utf8')).replace(/\r\n/g, '\n');
const htmlPages = await Promise.all(pages.map(page => read(page.file)));
const getGraph = html => JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1])['@graph'];

test('SEO regeneration is idempotent and every public page is registered', async () => {
  assert.deepEqual(await syncSEO({ check: true }), []);
});

test('titles and descriptions are unique and thematic', () => {
  assert.equal(new Set(pages.map(page => page.title)).size, pages.length);
  assert.equal(new Set(pages.map(page => page.description)).size, pages.length);
  for (const page of pages) assert.doesNotMatch(page.title, /белая версия|чёрная версия/i);
});

for (const [index, page] of pages.entries()) {
  const html = htmlPages[index];
  const head = html.match(/<head>([^]*?)<\/head>/)[1];
  const graph = getGraph(html);
  const url = absolute(page.path);

  test(`${page.file}: static head, canonical and social metadata`, async () => {
    assert.equal((head.match(/<title\b/g) || []).length, 1);
    assert.equal((head.match(/name="description"/g) || []).length, 1);
    assert.equal((head.match(/rel="canonical"/g) || []).length, 1);
    assert.equal(head.match(/rel="canonical" href="([^"]+)"/)[1], url);
    assert.equal(head.match(/property="og:url" content="([^"]+)"/)[1], url);
    assert.equal(head.match(/property="og:locale" content="([^"]+)"/)[1], 'ru_RU');
    assert.match(head, /max-image-preview:large/);
    assert.doesNotMatch(head, /noindex|nofollow|nosnippet|noai|data-theme-title/i);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /<html lang="ru">/);
    await access(new URL(page.image, root));
    await access(new URL('favicon.svg', root));
    await access(new URL('favicon-dark.svg', root));
  });

  test(`${page.file}: schema entities and references resolve`, () => {
    const objects = [];
    const walk = value => {
      if (!value || typeof value !== 'object') return;
      if (!Array.isArray(value)) objects.push(value);
      Object.values(value).forEach(walk);
    };
    walk(graph);
    const entities = objects.filter(object => object['@id'] && object['@type']);
    assert.equal(new Set(entities.map(entity => entity['@id'])).size, entities.length, 'duplicate entity definitions');
    for (const object of objects) {
      if (object['@id']) {
        assert.equal(new URL(object['@id']).origin, new URL(site.url).origin);
        if (!object['@type']) assert.ok(entities.some(entity => entity['@id'] === object['@id']), `unresolved ${object['@id']}`);
      }
      if (object.url) assert.equal(new URL(object.url).protocol, 'https:');
    }
    const webpage = graph.find(entity => entity['@id'] === `${url}#webpage`);
    assert.equal(webpage.url, url);
    assert.equal(webpage.inLanguage, 'ru-RU');
    assert.equal(webpage['@type'], page.kind === 'portfolio' ? 'CollectionPage' : 'WebPage');
    assert.ok(webpage.mainEntity);
    const organization = graph.find(entity => entity['@type'] === 'Organization');
    assert.ok(html.includes(organization.email));
    assert.ok(html.includes(`tel:${organization.telephone}`));
    assert.equal(organization.areaServed.name, 'Россия');
    assert.doesNotMatch(JSON.stringify(graph), /AggregateRating|Review|priceCurrency|streetAddress/);
    if (page.kind !== 'home') {
      const breadcrumb = graph.find(entity => entity['@type'] === 'BreadcrumbList');
      assert.deepEqual(breadcrumb.itemListElement.map(item => item.position), [1, 2]);
      assert.deepEqual(breadcrumb.itemListElement.map(item => item.item), [site.url, url]);
    }
  });

  test(`${page.file}: projects and FAQ match the visible HTML`, () => {
    const list = graph.find(entity => entity['@type'] === 'ItemList');
    const projects = extractProjects(html);
    assert.equal(list.numberOfItems, projects.length);
    assert.deepEqual(list.itemListElement.map(entry => entry.item.name), projects.map(project => project.name));
    assert.deepEqual(list.itemListElement.map(entry => entry.item.description), projects.map(project => project.description));
    assert.deepEqual(list.itemListElement.map(entry => entry.position), projects.map((_, i) => i + 1));
    const faq = graph.find(entity => entity['@type'] === 'FAQPage');
    if (page.faqSection) {
      assert.deepEqual(faq.mainEntity, extractFAQ(html, page.faqSection));
      assert.equal(faq.mainEntity.length, page.kind === 'home' ? 8 : 5);
      for (const question of faq.mainEntity) {
        assert.ok(question.name.endsWith('?'));
        assert.ok(question.acceptedAnswer.text.length > 50);
        assert.doesNotMatch(question.name, /<|\+/);
      }
    } else assert.equal(faq, undefined);
    const catalog = graph.find(entity => entity['@type'] === 'OfferCatalog');
    if (catalog) {
      assert.equal(catalog.itemListElement.length, page.kind === 'home' ? 7 : 4);
      for (const offer of catalog.itemListElement) {
        assert.ok(textContent(html).includes(offer.itemOffered.name));
        assert.ok(textContent(html).includes(offer.itemOffered.description));
      }
    }
  });

  test(`${page.file}: local resources and navigation targets exist`, async () => {
    for (const match of html.matchAll(/(?:src|href)="([^"\s]+)"/g)) {
      if (/^(https?:|data:|mailto:|tel:)/.test(match[1])) continue;
      const target = new URL(match[1], url);
      if (target.origin !== new URL(site.url).origin) continue;
      const file = target.pathname === '/' ? 'index.html' : target.pathname.slice(1);
      await access(new URL(file, root));
      // HTML reserves #top for the top of the document, even without an explicit id.
      if (file.endsWith('.html') && target.hash && target.hash !== '#top') {
        const targetHTML = file === page.file ? html : await read(file);
        assert.ok(targetHTML.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `missing anchor: ${match[1]}`);
      }
    }
  });
}

test('sitemap contains exactly the canonical pages and valid local images', async () => {
  const xml = await read('sitemap.xml');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls, pages.map(page => absolute(page.path)));
  for (const match of xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
    const url = new URL(match[1]);
    assert.equal(url.origin, new URL(site.url).origin);
    await access(new URL(url.pathname.slice(1), root));
  }
  assert.doesNotMatch(xml, /theme=|category=|topic=|<priority>|<changefreq>/);
});

test('robots allows search/AI crawlers and render resources; llms references canonical pages', async () => {
  const robots = await read('robots.txt');
  assert.match(robots, /User-agent: \*\nAllow: \/\n/);
  assert.deepEqual([...robots.matchAll(/^Disallow:\s*(.*)$/gm)].map(match => match[1]), ['/AGENTS.md']);
  assert.match(robots, /Clean-param: theme&topic \//);
  assert.ok(robots.includes(`Sitemap: ${absolute('sitemap.xml')}`));
  assert.doesNotMatch(robots, /Clean-param:.*category/);
  const llms = await read('llms.txt');
  for (const page of pages) assert.ok(llms.includes(absolute(page.path)));
});

test('theme switching keeps the title stable and preserves both favicon colors', async () => {
  const source = await read('theme.js');
  for (const theme of ['light', 'dark']) {
    const icon = { href: './favicon.svg' };
    const white = { disabled: false };
    const color = { content: '#ffffff' };
    const toggle = { setAttribute() {} };
    const document = {
      title: pages[0].title, documentElement: { dataset: {} },
      querySelector(selector) { return ({ '#white-theme': white, 'meta[name="theme-color"]': color, 'link[rel="icon"]': icon, '.theme-switch': toggle })[selector]; },
      addEventListener(event, callback) { if (event === 'DOMContentLoaded') callback(); },
    };
    vm.runInNewContext(source, { document, location: { search: `?theme=${theme}`, href: `${site.url}?theme=${theme}` }, localStorage: { getItem: () => null, setItem() {} }, URL, URLSearchParams });
    assert.equal(document.title, pages[0].title);
    assert.equal(document.documentElement.dataset.theme, theme);
    assert.equal(white.disabled, theme === 'dark');
    assert.equal(color.content, theme === 'dark' ? '#0c0e0c' : '#ffffff');
    assert.equal(icon.href, theme === 'dark' ? './favicon-dark.svg' : './favicon.svg');
    assert.equal(toggle.href, `/?theme=${theme === 'dark' ? 'light' : 'dark'}`);
  }
});
