'use strict';
const { assertPort } = require('./ports');
const { emptyState, normalizeState } = require('../domain/savedState');

function createStateRepository({ saveIdentity, store, logger }) {
  assertPort('SaveIdentity', saveIdentity);
  assertPort('PreferencesStore', store);

  function load() {
    const key = saveIdentity.currentKey();
    if (!key) return null;
    let normalized;
    try {
      normalized = normalizeState(store.load(key));
    } catch (e) {
      logger.error('stateRepository.load', e);
      normalized = { state: emptyState(), ok: false };
    }
    if (!normalized.ok) {
      try { store.quarantine(key); } catch (e) { logger.error('stateRepository.quarantine', e); }
    }
    return { key, state: normalized.state };
  }

  function save(key, state) {
    try {
      store.save(key, state);
      return true;
    } catch (e) {
      logger.error('stateRepository.save', e);
      return false;
    }
  }

  return { load, save };
}

module.exports = { createStateRepository };
