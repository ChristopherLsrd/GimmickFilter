'use strict';

const SAFE_KEY = /^[a-z0-9_-]+$/;

function fileOf(key) {
  if (typeof key !== 'string' || !SAFE_KEY.test(key)) throw new Error(`clé de sauvegarde invalide : ${key}`);
  return `prefs-${key}.json`;
}

function createStoragePreferencesStore(storage) {
  return {
    load(key) {
      const text = storage.readFile(fileOf(key));
      if (text === null || text === undefined) return null;
      return JSON.parse(text);
    },
    save(key, state) {
      storage.writeJSON(fileOf(key), state);
    },
    quarantine(key) {
      const file = fileOf(key);
      const text = storage.readFile(file);
      if (text !== null && text !== undefined) storage.writeFile(`${file}.bak`, text);
      storage.writeFile(file, 'null');
    },
  };
}

module.exports = { createStoragePreferencesStore };
