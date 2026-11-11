'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSqlSaveIdentity, saveKey } = require('../../src/adapters/SqlSaveIdentity');

test('saveKey construit une clé lisible et sûre pour un nom de fichier', () => {
  assert.equal(saveKey('Women Of Wrestling', '2025-12-01'), 'women-of-wrestling_20251201');
  assert.equal(saveKey('Équipe ÀÉ !', '2026-01-05'), 'equipe-ae_20260105');
  assert.equal(saveKey('', null), 'save_nodate');
  assert.equal(saveKey('x'.repeat(80), '2026').length, 60 + 1 + 4);
});

test('currentKey lit saveinfo', () => {
  const query = (sql) => {
    assert.match(sql, /FROM saveinfo/);
    return [{ saveName: 'WOW', saveStartDate: '2025-12-01' }];
  };
  assert.equal(createSqlSaveIdentity(query).currentKey(), 'wow_20251201');
});

test('currentKey renvoie null sans ligne ou si la base est fermée', () => {
  assert.equal(createSqlSaveIdentity(() => []).currentKey(), null);
  assert.equal(createSqlSaveIdentity(() => { throw new Error('no db'); }).currentKey(), null);
});
