'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createStoragePreferencesStore } = require('../../src/adapters/StoragePreferencesStore');

function fakeStorage(files = {}) {
  return {
    files,
    readFile(name) { return name in files ? files[name] : null; },
    writeFile(name, text) { files[name] = text; },
    writeJSON(name, value) { files[name] = JSON.stringify(value, null, 2); },
  };
}

test('load renvoie null pour un fichier absent', () => {
  assert.equal(createStoragePreferencesStore(fakeStorage()).load('wow_20251201'), null);
});

test('save puis load', () => {
  const storage = fakeStorage();
  const store = createStoragePreferencesStore(storage);
  store.save('wow_20251201', { version: 1, pinned: ['Cocky'] });
  assert.ok('prefs-wow_20251201.json' in storage.files);
  assert.deepEqual(store.load('wow_20251201'), { version: 1, pinned: ['Cocky'] });
});

test('load lève une erreur pour un JSON illisible', () => {
  const store = createStoragePreferencesStore(fakeStorage({ 'prefs-k.json': '{oops' }));
  assert.throws(() => store.load('k'), SyntaxError);
});

test('quarantine copie le fichier en .bak et le neutralise', () => {
  const storage = fakeStorage({ 'prefs-k.json': '{oops' });
  const store = createStoragePreferencesStore(storage);
  store.quarantine('k');
  assert.equal(storage.files['prefs-k.json.bak'], '{oops');
  assert.equal(store.load('k'), null);
});

test('une clé non sûre est refusée', () => {
  const store = createStoragePreferencesStore(fakeStorage());
  assert.throws(() => store.load('../x'), /clé de sauvegarde invalide/);
});
