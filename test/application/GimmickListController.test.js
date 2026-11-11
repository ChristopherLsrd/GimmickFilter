'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createGimmickListController } = require('../../src/application/GimmickListController');
const { createFakeCatalog, createFakeRepository, createFakeLogger } = require('../fakes');
const { emptyState } = require('../../src/domain/savedState');

const ROWS = [
  { name: 'Cocky', dispositionPreference: 'None', modifiers: 'Requires Entertainment Skill,Talking Angle Boost' },
  { name: 'Classic Heel', dispositionPreference: 'Heel', modifiers: 'Slow Popularity Gain' },
  { name: 'Wholesome Face', dispositionPreference: 'Face', modifiers: 'Capped Popularity' },
];

function setup(state = emptyState()) {
  const catalog = createFakeCatalog(ROWS);
  const repository = createFakeRepository(state);
  const logger = createFakeLogger();
  const controller = createGimmickListController({ catalog, repository, logger });
  return { catalog, repository, logger, controller };
}

const payload = (action, over = {}) => ({
  context: 'change', requirements: { known: true, unmet: ['Cocky'] }, selected: null, locale: 'fr', action, ...over,
});

test('open renvoie le panneau et la liste', () => {
  const { controller } = setup();
  const result = controller.open(payload());
  assert.deepEqual(result.panel.effects, ['Requires Entertainment Skill', 'Capped Popularity', 'Slow Popularity Gain', 'Talking Angle Boost']);
  assert.deepEqual(result.list.order, ['Classic Heel', 'Cocky', 'Wholesome Face']);
  assert.equal(result.panel.saveForm, null);
  assert.equal(result.toast, null);
});

test('open sans sauvegarde chargée renvoie null', () => {
  const { controller, repository } = setup();
  repository.available = false;
  assert.equal(controller.open(payload()), null);
});

test('open renvoie null et journalise si le catalogue échoue', () => {
  const { controller, catalog, logger } = setup();
  catalog.failWith = new Error('base fermée');
  assert.equal(controller.open(payload()), null);
  assert.equal(logger.errors.length, 1);
});

test('setDisposition filtre et enregistre', () => {
  const { controller, repository } = setup();
  const result = controller.act(payload({ type: 'setDisposition', arg: 'Heel' }));
  assert.deepEqual(result.list.order, ['Classic Heel']);
  assert.equal(repository.state.current.disposition, 'Heel');
  assert.equal(repository.saves, 1);
});

test('setMatch utilise les exigences envoyées par le script', () => {
  const { controller } = setup();
  assert.deepEqual(controller.act(payload({ type: 'setMatch', arg: 'nomatch' })).list.order, ['Cocky']);
});

test('toggleInclude et toggleExclude', () => {
  const { controller } = setup();
  assert.deepEqual(controller.act(payload({ type: 'toggleInclude', arg: 'Talking Angle Boost' })).list.order, ['Cocky']);
  const { controller: c2 } = setup();
  assert.deepEqual(c2.act(payload({ type: 'toggleExclude', arg: 'Capped Popularity' })).list.order, ['Classic Heel', 'Cocky']);
});

test('togglePin, hide et unhide', () => {
  const { controller, repository } = setup();
  assert.deepEqual(controller.act(payload({ type: 'togglePin', arg: 'Wholesome Face' })).list.order, ['Wholesome Face', 'Classic Heel', 'Cocky']);
  const hidden = controller.act(payload({ type: 'hide', arg: 'Cocky' }));
  assert.equal(hidden.toast, 'Cocky');
  assert.ok(hidden.list.hidden.includes('Cocky'));
  assert.deepEqual(repository.state.hidden, ['Cocky']);
  const back = controller.act(payload({ type: 'unhide', arg: 'Cocky' }));
  assert.equal(back.toast, null);
  assert.deepEqual(repository.state.hidden, []);
});

test('openSave propose le nom du filtre actif, cancelSave ferme le formulaire', () => {
  const { controller, repository } = setup();
  const opened = controller.act(payload({ type: 'openSave' }));
  assert.deepEqual(opened.panel.saveForm, { name: '', mode: 'edit', error: null });
  assert.equal(repository.saves, 0);
  assert.equal(controller.act(payload({ type: 'cancelSave' })).panel.saveForm, null);
});

test('le formulaire est propre à chaque contexte', () => {
  const { controller } = setup();
  controller.act(payload({ type: 'openSave' }));
  assert.equal(controller.open(payload(undefined, { context: 'contract' })).panel.saveForm, null);
  assert.notEqual(controller.open(payload()).panel.saveForm, null);
});

test('savePreset : nom vide, enregistrement, puis demande de confirmation', () => {
  const { controller, repository } = setup();
  controller.act(payload({ type: 'openSave' }));
  assert.deepEqual(controller.act(payload({ type: 'savePreset', arg: '  ' })).panel.saveForm, { name: '', mode: 'edit', error: 'empty' });
  const saved = controller.act(payload({ type: 'savePreset', arg: 'Promo heel' }));
  assert.equal(saved.panel.saveForm, null);
  assert.deepEqual(saved.panel.presets, ['Promo heel']);
  assert.equal(saved.panel.activePreset, 'Promo heel');
  const again = controller.act(payload({ type: 'savePreset', arg: 'promo  heel' }));
  assert.deepEqual(again.panel.saveForm, { name: 'promo heel', mode: 'confirm', error: null });
  assert.equal(repository.state.presets.length, 1);
});

test('confirmSave écrase le filtre existant', () => {
  const { controller, repository } = setup();
  controller.act(payload({ type: 'savePreset', arg: 'P' }));
  controller.act(payload({ type: 'setDisposition', arg: 'Face' }));
  const result = controller.act(payload({ type: 'confirmSave', arg: 'P' }));
  assert.equal(result.panel.saveForm, null);
  assert.equal(result.panel.dirty, false);
  assert.equal(repository.state.presets[0].criteria.disposition, 'Face');
});

test('modifier un critère après avoir choisi un filtre le marque modifié', () => {
  const { controller } = setup();
  controller.act(payload({ type: 'savePreset', arg: 'P' }));
  assert.equal(controller.act(payload({ type: 'setMatch', arg: 'match' })).panel.dirty, true);
});

test('applyPreset, deletePreset et reset', () => {
  const { controller } = setup();
  controller.act(payload({ type: 'setDisposition', arg: 'Heel' }));
  controller.act(payload({ type: 'savePreset', arg: 'Heels' }));
  controller.act(payload({ type: 'reset' }));
  const applied = controller.act(payload({ type: 'applyPreset', arg: 'Heels' }));
  assert.equal(applied.panel.criteria.disposition, 'Heel');
  const deleted = controller.act(payload({ type: 'deletePreset' }));
  assert.deepEqual(deleted.panel.presets, []);
  assert.equal(deleted.panel.activePreset, null);
  assert.equal(controller.act(payload({ type: 'reset' })).panel.criteria.disposition, 'all');
});

test('une action inconnue est journalisée et ne change rien', () => {
  const { controller, repository, logger } = setup();
  assert.notEqual(controller.act(payload({ type: 'pirater' })), null);
  assert.equal(repository.saves, 0);
  assert.equal(logger.errors.length, 1);
});

test('la sélection envoyée par le script est forcée visible', () => {
  const { controller } = setup();
  controller.act(payload({ type: 'setDisposition', arg: 'Heel' }));
  const result = controller.open(payload(undefined, { selected: 'Cocky' }));
  assert.deepEqual(result.list.forced, ['Cocky']);
});
