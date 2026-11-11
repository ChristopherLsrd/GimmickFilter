'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { PORTS, assertPort } = require('../../src/application/ports');

test('PORTS liste les méthodes de chaque port', () => {
  assert.deepEqual(PORTS.PreferencesStore, ['load', 'save', 'quarantine']);
  assert.deepEqual(PORTS.GimmickCatalog, ['loadGimmicks']);
  assert.deepEqual(PORTS.SaveIdentity, ['currentKey']);
});

test('assertPort renvoie une implémentation complète', () => {
  const impl = { currentKey() { return 'k'; } };
  assert.equal(assertPort('SaveIdentity', impl), impl);
});

test('assertPort signale les méthodes manquantes', () => {
  assert.throws(() => assertPort('PreferencesStore', { load() {} }), /PreferencesStore : méthode\(s\) manquante\(s\) save, quarantine/);
  assert.throws(() => assertPort('GimmickCatalog', null), TypeError);
});
