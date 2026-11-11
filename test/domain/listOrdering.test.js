'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildListModel } = require('../../src/domain/listOrdering');
const { toGimmick } = require('../../src/domain/gimmick');
const { emptyState } = require('../../src/domain/savedState');
const { setPinned, setHidden } = require('../../src/domain/preferences');
const { updateCriteria } = require('../../src/domain/presets');
const { setDisposition, toggleInclude } = require('../../src/domain/filterCriteria');
const { unknownRequirements } = require('../../src/domain/gimmickFilter');

const GIMMICKS = [
  toGimmick({ name: 'Cocky', dispositionPreference: 'None', modifiers: 'Talking Angle Boost' }),
  toGimmick({ name: 'Athlete', dispositionPreference: 'None', modifiers: 'Match Boost' }),
  toGimmick({ name: 'Classic Heel', dispositionPreference: 'Heel', modifiers: '' }),
  toGimmick({ name: 'Wholesome Face', dispositionPreference: 'Face', modifiers: '' }),
];

const build = (state, selected = null) => buildListModel({
  gimmicks: GIMMICKS, state, requirements: unknownRequirements(), selected,
});

test('sans réglage : ordre alphabétique, pas de séparateur', () => {
  const m = build(emptyState());
  assert.deepEqual(m.order, ['Athlete', 'Classic Heel', 'Cocky', 'Wholesome Face']);
  assert.equal(m.separatorAfter, null);
  assert.deepEqual(m.hidden, []);
  assert.deepEqual(m.counts, { shown: 4, pinnedFiltered: 0, hiddenBySetting: 0 });
});

test('les épinglées passent en tête avec un séparateur après la dernière', () => {
  const state = setPinned(setPinned(emptyState(), 'Wholesome Face', true), 'Cocky', true);
  const m = build(state);
  assert.deepEqual(m.order, ['Cocky', 'Wholesome Face', 'Athlete', 'Classic Heel']);
  assert.equal(m.separatorAfter, 'Wholesome Face');
  assert.deepEqual(m.pinned, ['Cocky', 'Wholesome Face']);
});

test('pas de séparateur si seules des épinglées sont visibles', () => {
  const state = updateCriteria(setPinned(emptyState(), 'Cocky', true), (c) => toggleInclude(c, 'Talking Angle Boost'));
  const m = build(state);
  assert.deepEqual(m.order, ['Cocky']);
  assert.equal(m.separatorAfter, null);
});

test('les masquées sont toujours exclues et comptées', () => {
  const m = build(setHidden(emptyState(), 'Athlete', true));
  assert.deepEqual(m.order, ['Classic Heel', 'Cocky', 'Wholesome Face']);
  assert.deepEqual(m.hidden, ['Athlete']);
  assert.equal(m.counts.hiddenBySetting, 1);
});

test('les filtres s\'appliquent aussi aux épinglées', () => {
  const state = updateCriteria(setPinned(emptyState(), 'Wholesome Face', true), (c) => setDisposition(c, 'Heel'));
  const m = build(state);
  assert.deepEqual(m.order, ['Classic Heel']);
  assert.equal(m.counts.pinnedFiltered, 1);
  assert.equal(m.separatorAfter, null);
});

test('la gimmick sélectionnée reste visible même filtrée ou masquée', () => {
  const filtered = updateCriteria(emptyState(), (c) => setDisposition(c, 'Heel'));
  const m = build(filtered, 'Cocky');
  assert.deepEqual(m.order, ['Classic Heel', 'Cocky']);
  assert.deepEqual(m.forced, ['Cocky']);
  const hidden = build(setHidden(emptyState(), 'Cocky', true), 'Cocky');
  assert.ok(hidden.order.includes('Cocky'));
  assert.deepEqual(hidden.forced, ['Cocky']);
});

test('une sélection inconnue ou vide ne force rien', () => {
  const filtered = updateCriteria(emptyState(), (c) => setDisposition(c, 'Heel'));
  assert.deepEqual(build(filtered, '').forced, []);
  assert.deepEqual(build(filtered, 'Inconnue').forced, []);
});

test('un effet absent du monde dans les critères est ignoré', () => {
  const state = updateCriteria(emptyState(), (c) => toggleInclude(c, 'Effet de mod disparu'));
  assert.equal(build(state).counts.shown, 4);
});

test('les noms épinglés ou masqués absents du monde sont ignorés', () => {
  const state = setHidden(setPinned(emptyState(), 'Fantôme', true), 'Autre fantôme', true);
  const m = build(state);
  assert.deepEqual(m.pinned, []);
  assert.equal(m.counts.hiddenBySetting, 0);
  assert.equal(m.separatorAfter, null);
});
