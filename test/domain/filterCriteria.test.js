'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  defaultCriteria, normalizeCriteria, setDisposition, setMatch, toggleInclude, toggleExclude,
  restrictToEffects, sameCriteria, isDefaultCriteria,
} = require('../../src/domain/filterCriteria');

test('les critères par défaut ne filtrent rien', () => {
  assert.deepEqual(defaultCriteria(), { disposition: 'all', match: 'all', include: [], exclude: [] });
});

test('normalizeCriteria corrige les valeurs invalides', () => {
  assert.deepEqual(normalizeCriteria({ disposition: 'Tweener', match: 'peut-être', include: 'x', exclude: null }), defaultCriteria());
  assert.deepEqual(normalizeCriteria(null), defaultCriteria());
});

test('normalizeCriteria retire de exclude les effets aussi présents dans include', () => {
  const c = normalizeCriteria({ disposition: 'Heel', match: 'match', include: ['Match Boost'], exclude: ['Match Boost', 'Added Cost'] });
  assert.deepEqual(c, { disposition: 'Heel', match: 'match', include: ['Match Boost'], exclude: ['Added Cost'] });
});

test('setDisposition et setMatch ignorent une valeur inconnue', () => {
  const c = defaultCriteria();
  assert.equal(setDisposition(c, 'Tweener'), c);
  assert.equal(setMatch(c, 'oui'), c);
  assert.equal(setDisposition(c, 'None').disposition, 'None');
  assert.equal(setMatch(c, 'nomatch').match, 'nomatch');
});

test('toggleInclude ajoute puis retire un effet', () => {
  const on = toggleInclude(defaultCriteria(), 'Talking Angle Boost');
  assert.deepEqual(on.include, ['Talking Angle Boost']);
  assert.deepEqual(toggleInclude(on, 'Talking Angle Boost').include, []);
});

test('inclure un effet le retire de exclude, et inversement', () => {
  const excluded = toggleExclude(defaultCriteria(), 'Capped Popularity');
  const included = toggleInclude(excluded, 'Capped Popularity');
  assert.deepEqual(included.include, ['Capped Popularity']);
  assert.deepEqual(included.exclude, []);
  const back = toggleExclude(included, 'Capped Popularity');
  assert.deepEqual(back.include, []);
  assert.deepEqual(back.exclude, ['Capped Popularity']);
});

test('toggleInclude ignore un effet vide', () => {
  const c = defaultCriteria();
  assert.equal(toggleInclude(c, '  '), c);
  assert.equal(toggleExclude(c, undefined), c);
});

test('restrictToEffects retire les effets absents du monde', () => {
  const c = normalizeCriteria({ include: ['Match Boost', 'Effet Mod'], exclude: ['Added Cost', 'Autre'] });
  const r = restrictToEffects(c, ['Match Boost', 'Added Cost']);
  assert.deepEqual(r.include, ['Match Boost']);
  assert.deepEqual(r.exclude, ['Added Cost']);
});

test('sameCriteria compare les valeurs, pas l\'ordre des listes', () => {
  const a = { disposition: 'Heel', match: 'all', include: ['B', 'A'], exclude: [] };
  const b = { disposition: 'Heel', match: 'all', include: ['A', 'B'], exclude: [] };
  assert.equal(sameCriteria(a, b), true);
  assert.equal(sameCriteria(a, { ...b, match: 'match' }), false);
});

test('isDefaultCriteria', () => {
  assert.equal(isDefaultCriteria(defaultCriteria()), true);
  assert.equal(isDefaultCriteria(setDisposition(defaultCriteria(), 'Face')), false);
});
