'use strict';
const { toGimmick } = require('../src/domain/gimmick');
const { emptyState } = require('../src/domain/savedState');

function createFakeCatalog(rows = []) {
  const gimmicks = rows.map(toGimmick).filter(Boolean);
  return {
    calls: 0,
    failWith: null,
    loadGimmicks() {
      this.calls += 1;
      if (this.failWith) throw this.failWith;
      return gimmicks;
    },
  };
}

function createMemoryStore(files = {}) {
  const data = { ...files };
  return {
    data,
    quarantined: [],
    load(key) {
      if (!(key in data)) return null;
      const value = data[key];
      if (value instanceof Error) throw value;
      return JSON.parse(JSON.stringify(value));
    },
    save(key, state) { data[key] = JSON.parse(JSON.stringify(state)); },
    quarantine(key) { this.quarantined.push(key); delete data[key]; },
  };
}

function createFakeSaveIdentity(key = 'save_20260101') {
  return { key, currentKey() { return this.key; } };
}

function createFakeLogger() {
  const errors = [];
  return { errors, log() {}, error(...args) { errors.push(args); } };
}

function createFakeRepository(state = emptyState(), key = 'save_20260101') {
  let current = state;
  return {
    saves: 0,
    available: true,
    get state() { return current; },
    load() { return this.available ? { key, state: current } : null; },
    save(k, next) { this.saves += 1; current = next; return true; },
  };
}

module.exports = {
  createFakeCatalog, createMemoryStore, createFakeSaveIdentity, createFakeLogger, createFakeRepository,
};
