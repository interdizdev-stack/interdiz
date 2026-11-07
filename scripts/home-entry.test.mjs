import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/home-entry.js', import.meta.url), 'utf8');

function openHome({ hash = '', type = 'navigate', saved, savedScroll, initialY = 0, storageUnavailable = false } = {}) {
  const location = { pathname: '/', search: '?theme=dark', hash };
  const classes = new Set();
  const frames = [];
  const listeners = new Map();
  const positions = [];
  const storage = new Map(saved ? [['interdiz-home-return', saved]] : []);
  if (savedScroll !== undefined) storage.set('interdiz-home-scroll', JSON.stringify({ url: `/?theme=dark${hash}`, top: savedScroll }));
  const history = {
    state: { visit: 1 }, scrollRestoration: 'auto',
    replaceState(state, _, url) { this.state = { ...state }; if (url) location.hash = new URL(url, 'https://interdiz.ru').hash; }
  };
  const window = {};
  vm.runInNewContext(source, {
    location, history, window, scrollY: initialY,
    scrollTo: options => positions.push({ ...options }),
    performance: { getEntriesByType: () => [{ type }] },
    sessionStorage: {
      getItem(key) { if (storageUnavailable) throw new Error('Storage unavailable'); return storage.get(key); },
      setItem(key, value) { if (storageUnavailable) throw new Error('Storage unavailable'); storage.set(key, value); },
      removeItem: key => storage.delete(key)
    },
    document: {
      readyState: 'complete', fonts: { ready: Promise.resolve() },
      documentElement: { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } },
      getElementById: id => ({ scrollIntoView: options => positions.push({ id, ...options }) })
    },
    requestAnimationFrame: callback => frames.push(callback),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name)
  });
  return { entry: window.interdizHomeEntry, location, history, classes, frames, listeners, positions, storage };
}

test('projects are positioned before they become visible, without an intermediate fragment jump', async () => {
  const page = openHome({ hash: '#projects' });
  assert.equal(page.entry.targetId, 'projects');
  assert.equal(page.location.hash, '');
  assert.equal(page.history.scrollRestoration, 'manual');
  assert.ok(page.classes.has('home-entry-pending'));
  let placements = 0;
  const place = () => { assert.ok(page.classes.has('home-entry-pending')); placements++; };
  const finished = page.entry.finish(place);
  assert.equal(page.entry.finish(place), finished);
  while (page.frames.length) page.frames.shift()();
  await finished;
  assert.equal(placements, 2);
  assert.equal(page.entry.pending, false);
  assert.equal(page.classes.size, 0);
  assert.equal(page.location.hash, '#projects');
  assert.deepEqual(page.history.state, { visit: 1 });
  assert.equal(page.listeners.has('error'), false);
  assert.equal(page.listeners.has('unhandledrejection'), false);
});

test('browser Back from portfolio restores projects even when the previous home hash was services', () => {
  assert.equal(openHome({ type: 'back_forward', hash: '#services', saved: 'projects' }).entry.targetId, 'projects');
});

test('an explicit projects link ignores a stale return marker during normal navigation', () => {
  assert.equal(openHome({ hash: '#projects', saved: 'services' }).entry.targetId, 'projects');
});

test('service links and browser Back retain their destination', () => {
  for (const hash of ['#services', '#solutions-track']) assert.equal(openHome({ hash }).entry.targetId, 'services');
  assert.equal(openHome({ type: 'back_forward', saved: 'services' }).entry.targetId, 'services');
});

test('ordinary home visits prepare the pinned layout and keep native history restoration', async () => {
  for (const hash of ['', '#top', '#contact']) {
    const page = openHome({ hash, saved: 'projects' });
    assert.ok(page.entry.pending);
    assert.ok(page.classes.has('home-entry-pending'));
    assert.equal(page.location.hash, hash);
    assert.equal(page.history.scrollRestoration, 'auto');
    const finished = page.entry.finish(() => {});
    while (page.frames.length) page.frames.shift()();
    await finished;
    assert.equal(page.classes.size, 0);
    assert.equal(page.location.hash, hash);
  }
});

test('reloading an anchored home entry preserves browser scroll restoration', async () => {
  const page = openHome({ type: 'reload', hash: '#services' });
  assert.equal(page.entry.restoreScroll, true);
  assert.equal(page.entry.targetId, null);
  assert.equal(page.location.hash, '#services');
  assert.equal(page.history.scrollRestoration, 'auto');
  const finished = page.entry.finish(() => {});
  while (page.frames.length) page.frames.shift()();
  await finished;
  assert.equal(page.location.hash, '#services');
  assert.equal(page.positions.length, 0);
});

test('initialization failure releases an ordinary home visit without moving it', async () => {
  const page = openHome({ type: 'reload' });
  await page.listeners.get('unhandledrejection')();
  assert.equal(page.entry.pending, false);
  assert.equal(page.classes.size, 0);
  assert.equal(page.positions.length, 0);
});

test('reload restores a saved position after the full pinned layout is ready', async () => {
  const page = openHome({ type: 'reload', hash: '#services', savedScroll: 9450 });
  assert.equal(page.entry.targetId, null);
  assert.equal(page.entry.scrollTop, 9450);
  assert.equal(page.history.scrollRestoration, 'manual');
  const finished = page.entry.finish(() => assert.ok(page.classes.has('home-entry-pending')));
  while (page.frames.length) page.frames.shift()();
  await finished;
  assert.equal(page.history.scrollRestoration, 'auto');
  assert.equal(page.location.hash, '#services');
});

test('leaving saves the position without changing other history state', async () => {
  const page = openHome({ initialY: 9450 });
  const finished = page.entry.finish(() => {});
  while (page.frames.length) page.frames.shift()();
  await finished;
  page.listeners.get('pagehide')();
  assert.deepEqual(page.history.state, { visit: 1 });
  assert.equal(JSON.parse(page.storage.get('interdiz-home-scroll')).top, 9450);
});

test('refreshing during initialization keeps the last stable position', () => {
  const page = openHome({ type: 'reload', savedScroll: 9450, initialY: 0 });
  page.listeners.get('pagehide')();
  assert.equal(JSON.parse(page.storage.get('interdiz-home-scroll')).top, 9450);
});

test('a new visit clears an old reload position', () => {
  const page = openHome({ savedScroll: 9450 });
  assert.equal(page.entry.scrollTop, null);
  assert.equal(page.storage.has('interdiz-home-scroll'), false);
});

test('invalid or unavailable saved positions keep native restoration', () => {
  for (const options of [{ savedScroll: 'invalid' }, { savedScroll: 9450, storageUnavailable: true }]) {
    const page = openHome({ type: 'reload', ...options });
    assert.equal(page.entry.scrollTop, null);
    assert.equal(page.history.scrollRestoration, 'auto');
  }
});

test('a failed reload releases the page at the nearest available saved offset', async () => {
  const page = openHome({ type: 'reload', savedScroll: 9450 });
  await page.listeners.get('unhandledrejection')();
  assert.equal(page.classes.size, 0);
  assert.deepEqual(page.positions, [{ top: 9450, behavior: 'instant' }]);
});

test('a blocked storage API does not break explicit return links', () => {
  assert.equal(openHome({ hash: '#projects', storageUnavailable: true }).entry.targetId, 'projects');
});

test('a failed app module releases the static page at the requested section', async () => {
  const page = openHome({ hash: '#projects' });
  await page.listeners.get('unhandledrejection')();
  assert.deepEqual(page.positions, [{ id: 'projects', block: 'start', behavior: 'instant' }]);
  assert.equal(page.location.hash, '#projects');
  assert.equal(page.entry.pending, false);
  assert.equal(page.classes.size, 0);
});
