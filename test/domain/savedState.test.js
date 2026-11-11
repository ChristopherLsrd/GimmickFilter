'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { emptyState, normalizeState } = require('../../src/domain/savedState');
const { defaultCriteria } = require('../../src/domain/filterCriteria');

test('emptyState', () => {
  assert.deepEqual(emptyState(), {
    version: 1, pinned: [], hidden: [], current: defaultCriteria(), activePreset: null, presets: [],
  });
});

test('un fichier absent donne un état vide valide', () => {
  assert.deepEqual(normalizeState(null), { state: emptyState(), ok: true });
  assert.deepEqual(normalizeState(undefined), { state: emptyState(), ok: true });
});

test('un contenu illisible ou d\'une autre version est signalé', () => {
  assert.equal(normalizeState('texte').ok, false);
  assert.equal(normalizeState([1, 2]).ok, false);
  assert.equal(normalizeState({ version: 2 }).ok, false);
  assert.deepEqual(normalizeState({ version: 2 }).state, emptyState());
});

test('normalizeState nettoie listes, critères et filtres enregistrés', () => {
  const { state, ok } = normalizeState({
    version: 1,
    pinned: ['Cocky', 'Cocky', ' Badass '],
    hidden: ['Lovable Loser', 'Cocky'],
    current: { disposition: 'Heel', include: ['Match Boost'] },
    activePreset: 'promo heel',
    presets: [
      { name: ' Promo heel ', criteria: { disposition: 'Heel' } },
      { name: 'PROMO HEEL', criteria: {} },
      { name: '', criteria: {} },
      null,
    ],
  });
  assert.equal(ok, true);
  assert.deepEqual(state.pinned, ['Badass', 'Cocky']);
  assert.deepEqual(state.hidden, ['Lovable Loser']);
  assert.deepEqual(state.current, { disposition: 'Heel', match: 'all', include: ['Match Boost'], exclude: [] });
  assert.deepEqual(state.presets, [{ name: 'Promo heel', criteria: { ...defaultCriteria(), disposition: 'Heel' } }]);
  assert.equal(state.activePreset, 'Promo heel');
});

test('un filtre actif qui n\'existe plus est oublié', () => {
  assert.equal(normalizeState({ version: 1, activePreset: 'Disparu', presets: [] }).state.activePreset, null);
});
