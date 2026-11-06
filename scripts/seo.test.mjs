import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
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
    assert.match(html, /<html lang="ru" data-theme="dark">/);
    assert.match(head, /name="theme-color" content="#0c0e0c"/);
    assert.match(head, /rel="icon"[^>]*href="\.\/favicon\.svg"/);
    assert.doesNotMatch(html, /white-theme|white\.css|theme-switch|data-theme="light"/);
    await access(new URL(page.image, root));
    await access(new URL('favicon.svg', root));
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
    assert.equal(webpage['@type'], ['portfolio', 'articles'].includes(page.kind) ? 'CollectionPage' : 'WebPage');
    if (page.kind !== 'articles') assert.ok(webpage.mainEntity);
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
    if (page.projectSection) {
      assert.ok(projects.length > 0);
      assert.equal(list.numberOfItems, projects.length);
      assert.deepEqual(list.itemListElement.map(entry => entry.item.name), projects.map(project => project.name));
      assert.deepEqual(list.itemListElement.map(entry => entry.item.description), projects.map(project => project.description));
      assert.deepEqual(list.itemListElement.map(entry => entry.position), projects.map((_, i) => i + 1));
    } else {
      assert.equal(projects.length, 0);
      assert.equal(list, undefined, 'do not invent projects for a service');
    }
    const faq = graph.find(entity => entity['@type'] === 'FAQPage');
    if (page.faqSection) {
      assert.deepEqual(faq.mainEntity, extractFAQ(html, page.faqSection));
      assert.ok(faq.mainEntity.length > 0);
      for (const question of faq.mainEntity) {
        assert.ok(question.name.endsWith('?'));
        assert.ok(question.acceptedAnswer.text.length > 50);
        assert.doesNotMatch(question.name, /<|\+/);
      }
    } else assert.equal(faq, undefined);
    const catalog = graph.find(entity => entity['@type'] === 'OfferCatalog');
    if (catalog) {
      assert.ok(catalog.itemListElement.length > 0);
      assert.ok(catalog.name);
      for (const offer of catalog.itemListElement) {
        assert.ok(textContent(html).includes(offer.itemOffered.name));
        assert.ok(textContent(html).includes(offer.itemOffered.description));
      }
    }
    if (page.kind === 'service') {
      const service = graph.find(entity => entity['@id'] === `${url}#service`);
      assert.equal(service.name, page.name);
      assert.equal(service.serviceType, page.serviceType || page.name);
      assert.equal(service.description, textContent(html.match(/<p class="hero-description">([^]*?)<\/p>/)[1]));
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

test('every home service card links directly to its own registered service page and schema entity', () => {
  const home = htmlPages[0];
  const cards = [...home.matchAll(/<article class="solution-card\b[^]*?<\/article>/g)].map(match => match[0]);
  const catalog = getGraph(home).find(entity => entity['@type'] === 'OfferCatalog');
  const linkedPages = new Set();
  assert.equal(cards.length, 7);
  assert.equal(catalog.itemListElement.length, cards.length);
  cards.forEach((card, index) => {
    const link = card.match(/<a class="contact-pill service-open" href="([^"]+)"/);
    assert.ok(link, 'a service must be reachable without JavaScript');
    const url = absolute(link[1]);
    const destination = pages.find(page => absolute(page.path) === url);
    assert.ok(destination, `unregistered service: ${url}`);
    assert.equal(destination.kind, 'service');
    assert.equal(destination.name, textContent(card.match(/<h3>([^]*?)<\/h3>/)[1]));
    assert.equal(catalog.itemListElement[index].itemOffered['@id'], `${url}#service`);
    assert.equal(catalog.itemListElement[index].itemOffered.url, url);
    linkedPages.add(destination.file);
  });
  assert.equal(linkedPages.size, cards.length);
  assert.deepEqual([...linkedPages].sort(), pages.filter(page => page.kind === 'service').map(page => page.file).sort());
  assert.doesNotMatch(home, /data-open-service|id="service-dialog"/);
});

test('the journal is an empty collection, without invented article metadata', () => {
  const index = pages.findIndex(page => page.kind === 'articles');
  assert.ok(index >= 0);
  const html = htmlPages[index];
  const graph = getGraph(html);
  assert.equal(graph.find(entity => entity['@id'].endsWith('#webpage'))['@type'], 'CollectionPage');
  assert.match(html, /id="article-list">\s*<\/div>/);
  assert.match(html, /Пока здесь нет опубликованных статей/);
  assert.doesNotMatch(html, /<article\b/);
  assert.doesNotMatch(JSON.stringify(graph), /"(?:Article|BlogPosting|NewsArticle|ItemList|datePublished|dateModified)"/);
});

test('all desktop headers and mobile menus link to articles before projects', () => {
  for (const html of htmlPages) {
    for (const fragment of [html.match(/<header\b[^]*?<\/header>/)?.[0], html.match(/<nav class="mobile-menu-links"[^]*?<\/nav>/)?.[0]]) {
      assert.ok(fragment);
      const links = [...fragment.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^]*?)<\/a>/g)];
      const articlesIndex = links.findIndex(link => textContent(link[2]) === 'Статьи');
      const projectsIndex = links.findIndex(link => textContent(link[2]).startsWith('Проекты'));
      assert.ok(articlesIndex >= 0 && articlesIndex + 1 === projectsIndex);
      assert.equal(absolute(links[articlesIndex][1]), absolute('articles.html'));
    }
  }
});

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

test('legacy theme links retain filters, anchors and history state without selecting a theme', async () => {
  const source = await read('theme.js');
  for (const theme of ['light', 'dark', 'unknown']) {
    let destination;
    let removed;
    const state = { visit: 3 };
    vm.runInNewContext(source, {
      URL, location: { href: `${site.url}portfolio.html?category=design&theme=${theme}&utm_source=test#projects` },
      localStorage: { removeItem(key) { removed = key; } },
      history: { state, replaceState(nextState, _, url) { assert.equal(nextState, state); destination = url; } }
    });
    assert.equal(destination, '/portfolio.html?category=design&utm_source=test#projects');
    assert.equal(removed, 'interdiz-theme');
  }
});

test('legacy theme cleanup tolerates blocked storage and leaves ordinary URLs untouched', async () => {
  const source = await read('theme.js');
  for (const search of ['', '?theme=light']) {
    let destination;
    vm.runInNewContext(source, {
      URL, location: { href: `${site.url}${search}#projects` },
      localStorage: { removeItem() { throw new Error('Storage blocked'); } },
      history: { state: null, replaceState(_, __, url) { destination = url; } }
    });
    assert.equal(destination, search ? '/#projects' : undefined);
  }
});

test('the shipped site has only dark styling, scene and favicon', async () => {
  assert.match(await read('favicon.svg'), /fill="#0c0e0c"/);
  for (const file of ['white.css', 'scene.js', 'favicon-dark.svg']) {
    await assert.rejects(access(new URL(file, root)), { code: 'ENOENT' });
  }
  for (const file of (await readdir(root)).filter(file => file.endsWith('.css'))) {
    assert.doesNotMatch(await read(file), /data-theme=["']light["']|theme-switch/, file);
  }
  const app = await read('app.js');
  assert.match(app, /import\('\.\/scene-dark\.js'\)/);
  assert.doesNotMatch(app, /dataset\.theme/);
});
