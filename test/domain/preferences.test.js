'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { emptyState } = require('../../src/domain/savedState');
const {
  setPinned, setHidden, togglePinned, unpinAll, unhideAll,
} = require('../../src/domain/preferences');

test('épingler puis désépingler', () => {
  const pinned = setPinned(emptyState(), 'Cocky', true);
  assert.deepEqual(pinned.pinned, ['Cocky']);
  assert.deepEqual(setPinned(pinned, 'Cocky', false).pinned, []);
});

test('épingler une gimmick masquée la réaffiche', () => {
  const s = setPinned(setHidden(emptyState(), 'Cocky', true), 'Cocky', true);
  assert.deepEqual(s.pinned, ['Cocky']);
  assert.deepEqual(s.hidden, []);
});

test('masquer une gimmick épinglée la désépingle', () => {
  const s = setHidden(setPinned(emptyState(), 'Cocky', true), 'Cocky', true);
  assert.deepEqual(s.pinned, []);
  assert.deepEqual(s.hidden, ['Cocky']);
});

test('togglePinned inverse l\'épingle', () => {
  const s = togglePinned(emptyState(), ' Cocky ');
  assert.deepEqual(s.pinned, ['Cocky']);
  assert.deepEqual(togglePinned(s, 'Cocky').pinned, []);
});

test('un nom vide ne change rien', () => {
  const s = emptyState();
  assert.equal(setPinned(s, '', true), s);
  assert.equal(setHidden(s, null, true), s);
  assert.equal(togglePinned(s, '  '), s);
});

test('unpinAll et unhideAll vident chaque liste', () => {
  const s = setHidden(setPinned(emptyState(), 'A', true), 'B', true);
  assert.deepEqual(unpinAll(s).pinned, []);
  assert.deepEqual(unpinAll(s).hidden, ['B']);
  assert.deepEqual(unhideAll(s).hidden, []);
  assert.deepEqual(unhideAll(s).pinned, ['A']);
});
