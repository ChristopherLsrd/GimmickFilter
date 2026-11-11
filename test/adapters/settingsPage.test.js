'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createSettingsPage, PAGE_ID, PAGE_SCRIPT, STOP_SCRIPT,
} = require('../../src/adapters/settingsPage');

const DATA = { gimmicks: [{ name: 'Cocky', disposition: 'None', effects: [], pinned: false, hidden: false }], presets: [], error: null };

function setup(controller) {
  const scripts = [];
  const pages = [];
  const menus = [];
  const handlers = {};
  const errors = [];
  const ui = {
    addPage(p) { pages.push(p); },
    addSideMenuItem(m) { menus.push(m); },
    executeJS(js) { scripts.push(js); return Promise.resolve(); },
  };
  const ipc = { handle(channel, fn) { handlers[channel] = fn; } };
  const page = createSettingsPage({ ui, ipc, controller, logger: { error(...a) { errors.push(a); } } });
  return { page, scripts, pages, menus, handlers, errors };
}

test('les scripts de page sont du JavaScript valide', () => {
  assert.doesNotThrow(() => new Function(PAGE_SCRIPT));
  assert.doesNotThrow(() => new Function(STOP_SCRIPT));
  assert.match(PAGE_SCRIPT, /window\.GimmickFilterPage/);
});

test('start ajoute la page, le menu, les canaux et le script', () => {
  const { page, scripts, pages, menus, handlers } = setup({ load() {}, act() {} });
  page.start();
  assert.equal(pages[0].id, PAGE_ID);
  assert.equal(pages[0].initFunction, 'GimmickFilterPage');
  assert.match(pages[0].html, /id="gf-page-root"/);
  assert.equal(menus[0].pageId, PAGE_ID);
  assert.equal(menus[0].label, 'Gimmick Filter');
  assert.deepEqual(Object.keys(handlers).sort(), ['page-action', 'page-load']);
  assert.deepEqual(scripts, [PAGE_SCRIPT]);
});

test('page-load rend la page ou le message sans sauvegarde', () => {
  let data = DATA;
  const { page, handlers } = setup({ load() { return data; }, act() {} });
  page.start();
  assert.match(handlers['page-load']({}, 'fr'), /data-gf-name="Cocky"/);
  data = null;
  assert.match(handlers['page-load']({}, 'fr'), /Charge une sauvegarde/);
});

test('page-action transmet l\'action au contrôleur', () => {
  const actions = [];
  const { page, handlers } = setup({ load() {}, act(a) { actions.push(a); return DATA; } });
  page.start();
  const html = handlers['page-action']({}, { type: 'unpinAll' }, 'en');
  assert.deepEqual(actions, [{ type: 'unpinAll' }]);
  assert.match(html, /Unpin all/);
});

test('une erreur du contrôleur donne le message sans sauvegarde et est journalisée', () => {
  const { page, handlers, errors } = setup({ load() { throw new Error('x'); }, act() {} });
  page.start();
  assert.match(handlers['page-load']({}, 'en'), /Load a save/);
  assert.equal(errors.length, 1);
});

test('stop et reinject', () => {
  const { page, scripts } = setup({ load() {}, act() {} });
  page.stop();
  page.reinject();
  assert.deepEqual(scripts, [STOP_SCRIPT, PAGE_SCRIPT]);
});

// Comportement réel : le script tourne dans un contexte vm avec des faux DOM et plugins.
function runPageScript() {
  const vm = require('node:vm');
  const rows = [{ attrs: { 'data-gf-search': 'cocky' }, classes: new Set() }];
  const root = {
    innerHTML: '',
    querySelector() { return null; },
    querySelectorAll(sel) {
      return sel === 'tr[data-gf-search]'
        ? rows.map((r) => ({
          getAttribute: (n) => r.attrs[n],
          classList: { toggle: (c, on) => { if (on) r.classes.add(c); else r.classes.delete(c); } },
        }))
        : [];
    },
  };
  const pending = [];
  const context = {
    console,
    I18n: { locale: 'fr' },
    document: { getElementById: (id) => (id === 'gf-page-root' ? root : null) },
    window: {},
    plugins: { invoke() { return new Promise((resolve) => pending.push(resolve)); } },
  };
  vm.createContext(context);
  vm.runInContext(PAGE_SCRIPT, context);
  return { context, root, rows, pending, vm };
}

test('une réponse arrivée après l\'arrêt n\'écrit pas dans le DOM', async () => {
  const { context, root, pending, vm } = runPageScript();
  context.window.GimmickFilterPage.init();
  vm.runInContext(STOP_SCRIPT, context);
  const before = root.innerHTML;
  pending[0]('<p>tardif</p>');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(root.innerHTML, before);
});

test('après l\'arrêt, la recherche ne modifie plus les lignes', () => {
  const { context, root, rows, vm } = runPageScript();
  context.window.GimmickFilterPage.init();
  vm.runInContext(STOP_SCRIPT, context);
  root.oninput({ target: { classList: { contains: () => true }, value: 'zzz' } });
  assert.equal(rows[0].classes.has('gf-filtered'), false);
});
