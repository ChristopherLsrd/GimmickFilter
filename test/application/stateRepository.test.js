'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createStateRepository } = require('../../src/application/stateRepository');
const { emptyState } = require('../../src/domain/savedState');
const { createMemoryStore, createFakeSaveIdentity, createFakeLogger } = require('../fakes');

function setup(files) {
  const store = createMemoryStore(files);
  const saveIdentity = createFakeSaveIdentity('wow_20251201');
  const logger = createFakeLogger();
  return { store, saveIdentity, logger, repo: createStateRepository({ saveIdentity, store, logger }) };
}

test('sans sauvegarde chargée, load renvoie null', () => {
  const { repo, saveIdentity } = setup();
  saveIdentity.key = null;
  assert.equal(repo.load(), null);
});

test('un fichier absent donne un état vide', () => {
  const { repo } = setup();
  assert.deepEqual(repo.load(), { key: 'wow_20251201', state: emptyState() });
});

test('un état valide est normalisé', () => {
  const { repo } = setup({ wow_20251201: { version: 1, pinned: ['Cocky', 'Cocky'] } });
  assert.deepEqual(repo.load().state.pinned, ['Cocky']);
});

test('un fichier illisible est mis de côté et remplacé par un état vide', () => {
  const { repo, store, logger } = setup({ wow_20251201: new SyntaxError('JSON invalide') });
  assert.deepEqual(repo.load().state, emptyState());
  assert.deepEqual(store.quarantined, ['wow_20251201']);
  assert.equal(logger.errors.length, 1);
});

test('une version inconnue est mise de côté', () => {
  const { repo, store } = setup({ wow_20251201: { version: 9 } });
  assert.deepEqual(repo.load().state, emptyState());
  assert.deepEqual(store.quarantined, ['wow_20251201']);
});

test('save écrit l\'état et signale un échec sans lever d\'erreur', () => {
  const { repo, store, logger } = setup();
  assert.equal(repo.save('wow_20251201', emptyState()), true);
  assert.deepEqual(store.data.wow_20251201, emptyState());
  store.save = () => { throw new Error('disque plein'); };
  assert.equal(repo.save('wow_20251201', emptyState()), false);
  assert.equal(logger.errors.length, 1);
});

test('si le fichier est illisible et la mise de côté échoue, load renvoie null', () => {
  const { repo, store, logger } = setup({ wow_20251201: new Error('E/S') });
  store.quarantine = () => { throw new Error('quarantaine impossible'); };
  assert.equal(repo.load(), null);
  assert.equal(logger.errors.length, 2);
});
