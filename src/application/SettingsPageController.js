'use strict';
const { assertPort } = require('./ports');
const { compareNames } = require('../domain/text');
const {
  setPinned, setHidden, unpinAll, unhideAll,
} = require('../domain/preferences');
const { renamePreset, deletePreset } = require('../domain/presets');

function createSettingsPageController({ catalog, repository, logger }) {
  assertPort('GimmickCatalog', catalog);

  function build(state, error) {
    let gimmicks;
    try {
      gimmicks = catalog.loadGimmicks();
    } catch (e) {
      logger.error('SettingsPageController.catalog', e);
      return null;
    }
    const pinned = new Set(state.pinned);
    const hidden = new Set(state.hidden);
    return {
      gimmicks: gimmicks.slice().sort((a, b) => compareNames(a.name, b.name)).map((g) => ({
        name: g.name,
        disposition: g.disposition,
        effects: g.effects.slice(),
        pinned: pinned.has(g.name),
        hidden: hidden.has(g.name),
      })),
      presets: state.presets.map((p) => p.name),
      error,
    };
  }

  function load() {
    const loaded = repository.load();
    return loaded ? build(loaded.state, null) : null;
  }

  function act(action) {
    const loaded = repository.load();
    if (!loaded) return null;
    const { type, arg } = action || {};
    const a = arg || {};
    let state = loaded.state;
    let error = null;
    switch (type) {
      case 'setPinned': state = setPinned(state, a.name, !!a.on); break;
      case 'setHidden': state = setHidden(state, a.name, !!a.on); break;
      case 'unpinAll': state = unpinAll(state); break;
      case 'unhideAll': state = unhideAll(state); break;
      case 'renamePreset': {
        const r = renamePreset(state, a.from, a.to);
        if (r.result === 'renamed') state = r.state;
        else if (r.result !== 'missing') error = r.result;
        break;
      }
      case 'deletePreset': state = deletePreset(state, arg); break;
      default: logger.error('SettingsPageController.act', `action inconnue : ${type}`);
    }
    if (state !== loaded.state) repository.save(loaded.key, state);
    return build(state, error);
  }

  return { load, act };
}

module.exports = { createSettingsPageController };
