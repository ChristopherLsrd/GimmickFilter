'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createGimmickListWatcher, toViewModel, WATCH_SCRIPT, STOP_SCRIPT,
} = require('../../src/adapters/gimmickListWatcher');
const { CSS } = require('../../src/adapters/styles');
const { defaultCriteria } = require('../../src/domain/filterCriteria');

const RESULT = {
  panel: {
    effects: ['Match Boost'], criteria: defaultCriteria(), presets: [], activePreset: null, dirty: false,
    counts: { shown: 1, pinnedFiltered: 0, hiddenBySetting: 0 }, saveForm: null,
  },
  list: { order: ['Athlete'], separatorAfter: null, hidden: [], forced: [], pinned: [] },
  toast: null,
};

function setup(controller) {
  const scripts = [];
  const css = [];
  const handlers = {};
  const listeners = {};
  const errors = [];
  const ui = {
    injectCSS(c) { css.push(c); },
    executeJS(js) { scripts.push(js); return Promise.resolve(); },
  };
  const ipc = {
    handle(channel, fn) { handlers[channel] = fn; },
    on(channel, fn) { listeners[channel] = fn; },
  };
  const logger = { error(...args) { errors.push(args); } };
  const watcher = createGimmickListWatcher({ ui, ipc, controller, logger, css: CSS });
  return { watcher, scripts, css, handlers, listeners, errors };
}

test('les scripts injectés sont du JavaScript valide', () => {
  assert.doesNotThrow(() => new Function(WATCH_SCRIPT));
  assert.doesNotThrow(() => new Function(STOP_SCRIPT));
});

test('le script vise les deux listes du jeu et le pont plugins', () => {
  assert.match(WATCH_SCRIPT, /#changeGimmickModal/);
  assert.match(WATCH_SCRIPT, /#negotiationModal \.negotiateGimmickContainer \.gimmickSelect/);
  assert.match(WATCH_SCRIPT, /plugins\.invoke\(PLUGIN, channel/);
  assert.match(WATCH_SCRIPT, /'list-open'/);
  assert.match(WATCH_SCRIPT, /'list-action'/);
  assert.match(WATCH_SCRIPT, /addEventListener\('click', onClick, true\)/);
  assert.match(STOP_SCRIPT, /__gimmickFilter/);
});

test('start injecte le CSS, enregistre les canaux et lance le script', () => {
  const { watcher, scripts, css, handlers, listeners } = setup({ open() {}, act() {} });
  watcher.start();
  assert.deepEqual(css, [CSS]);
  assert.deepEqual(Object.keys(handlers).sort(), ['list-action', 'list-open']);
  assert.ok(listeners.warn);
  assert.deepEqual(scripts, [WATCH_SCRIPT]);
});

test('list-open renvoie le modèle de vue rendu', () => {
  const calls = [];
  const { watcher, handlers } = setup({ open(p) { calls.push(p); return RESULT; }, act() {} });
  watcher.start();
  const vm = handlers['list-open']({}, { context: 'change', locale: 'fr' });
  assert.equal(calls.length, 1);
  assert.match(vm.panelHtml, /^<div class="gf-panel"/);
  assert.deepEqual(vm.list, RESULT.list);
  assert.equal(vm.toastHtml, null);
  assert.equal(vm.labels.pin, 'Épingler');
});

test('list-action rend le bandeau quand une gimmick vient d\'être masquée', () => {
  const { watcher, handlers } = setup({ open() {}, act() { return { ...RESULT, toast: 'Cocky' }; } });
  watcher.start();
  const vm = handlers['list-action']({}, { context: 'change', locale: 'en', action: { type: 'hide', arg: 'Cocky' } });
  assert.match(vm.toastHtml, /Cocky hidden/);
});

test('un résultat null ou une erreur renvoie null', () => {
  const { watcher, handlers, errors } = setup({ open() { return null; }, act() { throw new Error('boum'); } });
  watcher.start();
  assert.equal(handlers['list-open']({}, { locale: 'fr' }), null);
  assert.equal(handlers['list-action']({}, { locale: 'fr' }), null);
  assert.equal(errors.length, 1);
});

test('les avertissements du script sont journalisés', () => {
  const { watcher, listeners, errors } = setup({ open() {}, act() {} });
  watcher.start();
  listeners.warn({}, 'listes introuvables');
  assert.deepEqual(errors, [['gimmickListWatcher', 'listes introuvables']]);
});

test('stop et reinject exécutent les bons scripts', () => {
  const { watcher, scripts } = setup({ open() {}, act() {} });
  watcher.stop();
  watcher.reinject();
  assert.deepEqual(scripts, [STOP_SCRIPT, WATCH_SCRIPT]);
});

test('toViewModel renvoie null pour un résultat null', () => {
  assert.equal(toViewModel(null, 'fr'), null);
});

test('le script se protège des boucles, courses et réponses tardives', () => {
  assert.ok(WATCH_SCRIPT.includes("inactive[ctx.id]"));
  assert.ok(WATCH_SCRIPT.includes("inflight[ctx.id]"));
  assert.ok(WATCH_SCRIPT.includes("if (stopped) return;"));
  assert.ok(WATCH_SCRIPT.includes("lastSignature[ctx.id] = signature(sent)"));
  assert.match(WATCH_SCRIPT, /u2298/);
  assert.doesNotThrow(() => new Function(WATCH_SCRIPT));
});
