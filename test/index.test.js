'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const plugin = require('../index');

function fakeApi() {
  const api = {
    scripts: [], handlers: {}, listeners: {}, pages: [], css: [], removed: 0,
    console: { log() {}, error() {} },
    database: { query: () => [] },
    storage: { readFile: () => null, writeFile() {}, writeJSON() {} },
    ipc: {
      on(c, fn) { api.listeners[c] = fn; },
      handle(c, fn) { api.handlers[c] = fn; },
    },
    ui: {
      injectCSS(c) { api.css.push(c); },
      executeJS(js) { api.scripts.push(js); return Promise.resolve(); },
      addPage(p) { api.pages.push(p); },
      addSideMenuItem() {},
      widgets: { removeAll() { api.removed += 1; } },
    },
  };
  return api;
}

test('activate branche les listes et la page', () => {
  const api = fakeApi();
  plugin.activate(api);
  assert.deepEqual(Object.keys(api.handlers).sort(), ['list-action', 'list-open', 'page-action', 'page-load']);
  assert.ok(api.listeners.warn);
  assert.equal(api.pages[0].id, 'gimmickFilterPage');
  assert.equal(api.css.length, 1);
  assert.equal(api.scripts.length, 2);
  plugin.deactivate();
});

test('list-open sans sauvegarde chargée renvoie null', () => {
  const api = fakeApi();
  plugin.activate(api);
  assert.equal(api.handlers['list-open']({}, { context: 'change', locale: 'fr' }), null);
  plugin.deactivate();
});

test('onRendererLoad réinjecte les deux scripts', () => {
  const api = fakeApi();
  plugin.activate(api);
  api.scripts.length = 0;
  plugin.onRendererLoad();
  assert.equal(api.scripts.length, 2);
  plugin.deactivate();
});

test('deactivate arrête les scripts et nettoie', () => {
  const api = fakeApi();
  plugin.activate(api);
  api.scripts.length = 0;
  plugin.deactivate();
  assert.equal(api.removed, 1);
  assert.ok(api.scripts.some((s) => /__gimmickFilter/.test(s)));
  assert.ok(api.scripts.some((s) => /GimmickFilterPage/.test(s)));
  assert.ok(api.scripts.some((s) => /data-plugin-id="gimmick-filter"/.test(s)));
});
