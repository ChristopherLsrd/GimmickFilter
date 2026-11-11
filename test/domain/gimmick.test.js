'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseEffects, normalizeDisposition, toGimmick, isRequirement, listEffects,
} = require('../../src/domain/gimmick');

test('parseEffects découpe, nettoie et dédoublonne en gardant l\'ordre', () => {
  assert.deepEqual(
    parseEffects('Match Boost, Requires Wrestling Skill,,Match Boost ,Slow Popularity Loss'),
    ['Match Boost', 'Requires Wrestling Skill', 'Slow Popularity Loss'],
  );
});

test('parseEffects renvoie une liste vide pour une valeur vide ou absente', () => {
  assert.deepEqual(parseEffects(''), []);
  assert.deepEqual(parseEffects(null), []);
});

test('normalizeDisposition garde Face, Heel, None et ramène le reste à None', () => {
  assert.equal(normalizeDisposition('Heel'), 'Heel');
  assert.equal(normalizeDisposition(' Face '), 'Face');
  assert.equal(normalizeDisposition('Tweener'), 'None');
  assert.equal(normalizeDisposition(null), 'None');
});

test('toGimmick construit une gimmick gelée', () => {
  const g = toGimmick({ name: ' Cocky ', modifiers: 'Talking Angle Boost,Fast Popularity Gain', dispositionPreference: 'None' });
  assert.deepEqual(g, { name: 'Cocky', disposition: 'None', effects: ['Talking Angle Boost', 'Fast Popularity Gain'] });
  assert.ok(Object.isFrozen(g));
  assert.ok(Object.isFrozen(g.effects));
});

test('toGimmick refuse une ligne sans nom', () => {
  assert.equal(toGimmick({ name: '  ', modifiers: '' }), null);
  assert.equal(toGimmick(null), null);
});

test('isRequirement reconnaît les effets « Requires … »', () => {
  assert.equal(isRequirement('Requires Intimidation'), true);
  assert.equal(isRequirement('Match Boost'), false);
});

test('listEffects met les exigences en premier, chaque groupe trié', () => {
  const gimmicks = [
    toGimmick({ name: 'A', modifiers: 'Talking Angle Boost,Requires Wrestling Skill' }),
    toGimmick({ name: 'B', modifiers: 'Added Cost,Requires Entertainment Skill,Talking Angle Boost' }),
  ];
  assert.deepEqual(listEffects(gimmicks), [
    'Requires Entertainment Skill', 'Requires Wrestling Skill', 'Added Cost', 'Talking Angle Boost',
  ]);
});
