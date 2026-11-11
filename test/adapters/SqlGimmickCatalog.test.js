'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSqlGimmickCatalog, SQL } = require('../../src/adapters/SqlGimmickCatalog');

test('lit les gimmicks en lecture seule', () => {
  const calls = [];
  const query = (sql, params) => {
    calls.push([sql, params]);
    return [
      { name: 'Cocky', modifiers: 'Talking Angle Boost', dispositionPreference: 'None' },
      { name: 'Cocky', modifiers: 'Doublon', dispositionPreference: 'Heel' },
      { name: '', modifiers: '', dispositionPreference: 'None' },
      { name: 'Classic Heel', modifiers: '', dispositionPreference: 'Heel' },
    ];
  };
  const gimmicks = createSqlGimmickCatalog(query).loadGimmicks();
  assert.deepEqual(calls, [[SQL, []]]);
  assert.match(SQL, /^SELECT name, modifiers, dispositionPreference FROM gimmicks/);
  assert.deepEqual(gimmicks.map((g) => g.name), ['Cocky', 'Classic Heel']);
  assert.deepEqual(gimmicks[0].effects, ['Talking Angle Boost']);
});

test('un résultat qui n\'est pas un tableau donne une liste vide', () => {
  assert.deepEqual(createSqlGimmickCatalog(() => undefined).loadGimmicks(), []);
});
