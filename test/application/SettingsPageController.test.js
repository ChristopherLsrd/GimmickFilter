'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSettingsPageController } = require('../../src/application/SettingsPageController');
const { createFakeCatalog, createFakeRepository, createFakeLogger } = require('../fakes');
const { emptyState } = require('../../src/domain/savedState');

const ROWS = [
  { name: 'Cocky', dispositionPreference: 'None', modifiers: 'Talking Angle Boost' },
  { name: 'Athlete', dispositionPreference: 'None', modifiers: 'Match Boost' },
];

function setup(state = emptyState()) {
  const catalog = createFakeCatalog(ROWS);
  const repository = createFakeRepository(state);
  const logger = createFakeLogger();
  return { catalog, repository, logger, controller: createSettingsPageController({ catalog, repository, logger }) };
}

test('load liste les gimmicks triées avec leur état', () => {
  const { controller } = setup({ ...emptyState(), pinned: ['Cocky'] });
  assert.deepEqual(controller.load(), {
    gimmicks: [
      { name: 'Athlete', disposition: 'None', effects: ['Match Boost'], pinned: false, hidden: false },
      { name: 'Cocky', disposition: 'None', effects: ['Talking Angle Boost'], pinned: true, hidden: false },
    ],
    presets: [],
    error: null,
  });
});

test('load renvoie null sans sauvegarde ou si le catalogue échoue', () => {
  const { controller, repository, catalog, logger } = setup();
  repository.available = false;
  assert.equal(controller.load(), null);
  repository.available = true;
  catalog.failWith = new Error('x');
  assert.equal(controller.load(), null);
  assert.equal(logger.errors.length, 1);
});

test('setPinned et setHidden enregistrent et restent exclusifs', () => {
  const { controller, repository } = setup();
  controller.act({ type: 'setPinned', arg: { name: 'Cocky', on: true } });
  const data = controller.act({ type: 'setHidden', arg: { name: 'Cocky', on: true } });
  assert.deepEqual(repository.state.pinned, []);
  assert.deepEqual(repository.state.hidden, ['Cocky']);
  assert.equal(data.gimmicks.find((g) => g.name === 'Cocky').hidden, true);
});

test('unpinAll et unhideAll', () => {
  const { controller, repository } = setup({ ...emptyState(), pinned: ['Athlete'], hidden: ['Cocky'] });
  controller.act({ type: 'unpinAll' });
  controller.act({ type: 'unhideAll' });
  assert.deepEqual(repository.state.pinned, []);
  assert.deepEqual(repository.state.hidden, []);
});

test('renamePreset renomme ou renvoie l\'erreur', () => {
  const presets = [{ name: 'A', criteria: emptyState().current }, { name: 'B', criteria: emptyState().current }];
  const { controller, repository } = setup({ ...emptyState(), presets });
  assert.equal(controller.act({ type: 'renamePreset', arg: { from: 'A', to: 'b' } }).error, 'exists');
  assert.equal(controller.act({ type: 'renamePreset', arg: { from: 'A', to: ' ' } }).error, 'empty');
  const ok = controller.act({ type: 'renamePreset', arg: { from: 'A', to: 'C' } });
  assert.equal(ok.error, null);
  assert.deepEqual(repository.state.presets.map((p) => p.name), ['B', 'C']);
});

test('deletePreset', () => {
  const { controller, repository } = setup({ ...emptyState(), presets: [{ name: 'A', criteria: emptyState().current }] });
  assert.deepEqual(controller.act({ type: 'deletePreset', arg: 'A' }).presets, []);
  assert.deepEqual(repository.state.presets, []);
});

test('une action inconnue est journalisée sans enregistrement', () => {
  const { controller, repository, logger } = setup();
  controller.act({ type: 'nimporte' });
  assert.equal(repository.saves, 0);
  assert.equal(logger.errors.length, 1);
});
