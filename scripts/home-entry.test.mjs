import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../dist/home-entry.js', import.meta.url), 'utf8');

function openHome({ hash = '', type = 'navigate', saved, storageUnavailable = false } = {}) {
  const location = { pathname: '/', search: '?theme=dark', hash };
  const classes = new Set();
  const frames = [];
  const listeners = new Map();
  const positions = [];
  const storage = new Map(saved ? [['interdiz-home-return', saved]] : []);
  const history = {
    state: { visit: 1 }, scrollRestoration: 'auto',
    replaceState(state, _, url) { this.state = state; location.hash = new URL(url, 'https://interdiz.ru').hash; }
  };
  const window = {};
  vm.runInNewContext(source, {
    location, history, window,
    performance: { getEntriesByType: () => [{ type }] },
    sessionStorage: {
      getItem(key) { if (storageUnavailable) throw new Error('Storage unavailable'); return storage.get(key); },
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
  return { entry: window.interdizHomeEntry, location, history, classes, frames, listeners, positions };
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
  assert.equal(page.listeners.size, 0);
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

test('ordinary home visits remain visible and keep native history restoration', () => {
  for (const hash of ['', '#top', '#contact']) {
    const page = openHome({ hash, saved: 'projects' });
    assert.equal(page.entry, undefined);
    assert.equal(page.classes.size, 0);
    assert.equal(page.location.hash, hash);
    assert.equal(page.history.scrollRestoration, 'auto');
  }
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
