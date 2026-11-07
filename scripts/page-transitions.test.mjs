import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/page-transitions.js', import.meta.url), 'utf8');
const key = 'interdiz-page-transition';

test('all public pages install the shared transition before parsing the body', async () => {
  const directory = new URL('../dist/', import.meta.url);
  const filenames = (await readdir(directory)).filter(filename => filename.endsWith('.html'));
  for (const filename of filenames) {
    const html = await readFile(new URL(filename, directory), 'utf8');
    const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0] ?? '';
    assert.match(head, /<script src="\.\/page-transitions\.js"><\/script>/, filename);
    assert.match(head, /href="\.\/style\.css"/, filename);
    if (filename === 'index.html') assert.ok(head.indexOf('page-transitions.js') < head.indexOf('home-entry.js'));
  }
});

function openPage({ incoming = false, reduced = false, storedReduced = false, blockedStorage = false, type = 'navigate', referrer = '' } = {}) {
  const classes = new Set();
  const listeners = new Map();
  const timers = new Map();
  const frames = [];
  const navigations = [];
  const storage = new Map();
  const location = new URL('https://interdiz.ru/design.html');
  location.assign = url => navigations.push(url);
  if (incoming) storage.set(key, JSON.stringify({ url: location.href, time: Date.now() }));
  if (storedReduced) storage.set('interdiz-reduced', 'true');
  const preference = { matches: reduced, addEventListener(_, callback) { this.change = callback; } };
  const root = {
    classList: {
      contains: name => classes.has(name),
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
    }
  };
  let observer;
  const dispatch = (name, event = {}) => {
    const callbacks = listeners.get(name) ?? [];
    return Promise.all(callbacks.map(({ callback }) => callback(event)));
  };
  vm.runInNewContext(source, {
    URL, Date, location, performance: { getEntriesByType: () => [{ type }] },
    matchMedia: () => preference,
    document: { documentElement: root, referrer, readyState: 'loading', fonts: { ready: Promise.resolve() } },
    sessionStorage: {
      getItem(name) { if (blockedStorage) throw new Error('Blocked'); return storage.get(name) ?? null; },
      setItem(name, value) { if (blockedStorage) throw new Error('Blocked'); storage.set(name, value); },
      removeItem(name) { if (blockedStorage) throw new Error('Blocked'); storage.delete(name); },
    },
    addEventListener(name, callback, options) {
      const callbacks = listeners.get(name) ?? [];
      callbacks.push({ callback, capture: options?.capture === true });
      callbacks.sort((a, b) => Number(b.capture) - Number(a.capture));
      listeners.set(name, callbacks);
    },
    requestAnimationFrame: callback => frames.push(callback),
    cancelAnimationFrame: () => {},
    setTimeout(callback, delay) { const id = timers.size + 1; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observer = this; }
      observe() { this.observing = true; }
      disconnect() { this.observing = false; }
    },
  });
  function click(href = '/seo.html', options = {}) {
    const link = { href: new URL(href, location).href, target: options.target ?? '', hasAttribute: name => options.download && name === 'download' };
    const event = {
      button: 0, defaultPrevented: false,
      target: { closest: () => link },
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.stopped = true; },
      ...options,
    };
    for (const { callback } of listeners.get('click')) {
      callback(event);
      if (event.stopped) break;
    }
    return event;
  }
  function expire(delay) {
    for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.callback(); }
  }
  return {
    classes, root, storage, navigations, frames, timers, preference, click, dispatch, expire,
    mutate: () => observer?.observing && observer.callback(),
    animate: animationName => dispatch('animationend', { target: root, pseudoElement: '::before', animationName }),
  };
}

test('one navigation follows the outgoing animation and rapid clicks keep the first destination', async () => {
  const page = openPage();
  assert.equal(page.click('/seo.html').defaultPrevented, true);
  assert.ok(page.classes.has('page-transition-out'));
  assert.equal(page.navigations.length, 0);
  assert.equal(page.click('/articles.html').stopped, true);
  await page.animate('page-curtain-cover');
  page.expire(280);
  assert.deepEqual(page.navigations, ['https://interdiz.ru/seo.html']);
  assert.equal(JSON.parse(page.storage.get(key)).url, page.navigations[0]);
});

test('animation failure still follows the requested link', () => {
  const page = openPage();
  page.click('/portfolio.html?category=web#work');
  page.expire(280);
  assert.deepEqual(page.navigations, ['https://interdiz.ru/portfolio.html?category=web#work']);
});

test('anchors, downloads, external links, new tabs and handled clicks retain browser behavior', () => {
  for (const [href, options] of [
    ['#formats', {}], ['/design.html#contact', {}], ['https://example.com/', {}],
    ['mailto:hello@example.com', {}], ['/favicon.svg', {}], ['/seo.html', { download: true }],
    ['/seo.html', { target: '_blank' }], ['/seo.html', { ctrlKey: true }],
    ['/seo.html', { metaKey: true }], ['/seo.html', { shiftKey: true }],
    ['/seo.html', { altKey: true }], ['/seo.html', { button: 1 }],
    ['/seo.html', { defaultPrevented: true }],
  ]) {
    const page = openPage();
    page.click(href, options);
    assert.equal(page.classes.size, 0, href);
    assert.equal(page.timers.size, 0, href);
  }
});

test('incoming curtain waits for home scroll and card restoration', async () => {
  const page = openPage({ incoming: true });
  page.classes.add('home-entry-pending');
  await page.dispatch('load');
  assert.equal(page.frames.length, 0);
  assert.ok(page.classes.has('page-transition-in'));
  assert.equal(page.storage.has(key), false);
  page.classes.delete('home-entry-pending');
  page.mutate();
  page.frames.shift()();
  assert.ok(page.classes.has('page-transition-reveal'));
  await page.animate('page-curtain-reveal');
  assert.equal(page.classes.size, 0);
});

test('reduced motion keeps navigation immediate for system and saved preferences', () => {
  for (const options of [{ reduced: true }, { storedReduced: true }]) {
    const page = openPage({ ...options, incoming: true });
    assert.equal(page.click().defaultPrevented, false);
    assert.equal(page.classes.size, 0);
  }
});

test('changing motion preference while leaving still completes navigation', () => {
  const page = openPage();
  page.click();
  page.preference.matches = true;
  page.preference.change();
  assert.equal(page.classes.size, 0);
  assert.deepEqual(page.navigations, ['https://interdiz.ru/seo.html']);
});

test('blocked storage still supports both transition phases', async () => {
  const page = openPage({ blockedStorage: true, referrer: 'https://interdiz.ru/' });
  await page.dispatch('load');
  page.frames.shift()();
  page.expire(480);
  assert.equal(page.classes.size, 0);
  page.click();
  page.expire(280);
  assert.deepEqual(page.navigations, ['https://interdiz.ru/seo.html']);
});

test('Back/Forward restores a usable page and releases the incoming curtain', async () => {
  const page = openPage();
  page.click();
  await page.dispatch('pagehide');
  assert.equal(page.classes.size, 0);
  assert.equal(page.timers.size, 0);
  await page.dispatch('pageshow', { persisted: true });
  page.frames.shift()();
  assert.ok(page.classes.has('page-transition-reveal'));
  page.expire(480);
  assert.equal(page.classes.size, 0);
  assert.equal(page.click().defaultPrevented, true);
});

test('direct visits and reloads have no transition curtain', () => {
  for (const options of [{}, { type: 'reload', referrer: 'https://interdiz.ru/' }]) {
    assert.equal(openPage(options).classes.size, 0);
  }
});
