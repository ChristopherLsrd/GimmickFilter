'use strict';
const { assertPort } = require('./ports');
const { listEffects } = require('../domain/gimmick');
const {
  restrictToEffects, setDisposition, setMatch, toggleInclude, toggleExclude,
} = require('../domain/filterCriteria');
const { toRequirements } = require('../domain/gimmickFilter');
const { setHidden, togglePinned } = require('../domain/preferences');
const {
  savePreset, deletePreset, applyPreset, resetCriteria, updateCriteria, isDirty, normalizePresetName,
} = require('../domain/presets');
const { buildListModel } = require('../domain/listOrdering');

const STATE_ACTIONS = Object.freeze({
  setDisposition: (state, arg) => updateCriteria(state, (c) => setDisposition(c, arg)),
  setMatch: (state, arg) => updateCriteria(state, (c) => setMatch(c, arg)),
  toggleInclude: (state, arg) => updateCriteria(state, (c) => toggleInclude(c, arg)),
  toggleExclude: (state, arg) => updateCriteria(state, (c) => toggleExclude(c, arg)),
  applyPreset: (state, arg) => applyPreset(state, arg),
  deletePreset: (state) => (state.activePreset ? deletePreset(state, state.activePreset) : state),
  reset: (state) => resetCriteria(state),
  togglePin: (state, arg) => togglePinned(state, arg),
  hide: (state, arg) => setHidden(state, arg, true),
  unhide: (state, arg) => setHidden(state, arg, false),
});

function createGimmickListController({ catalog, repository, logger }) {
  assertPort('GimmickCatalog', catalog);
  const saveForms = new Map();

  function build(context, state, payload, toast) {
    let gimmicks;
    try {
      gimmicks = catalog.loadGimmicks();
    } catch (e) {
      logger.error('GimmickListController.catalog', e);
      return null;
    }
    const effects = listEffects(gimmicks);
    const model = buildListModel({
      gimmicks, state, requirements: toRequirements(payload.requirements), selected: payload.selected,
    });
    return {
      panel: {
        effects,
        criteria: restrictToEffects(state.current, effects),
        presets: state.presets.map((p) => p.name),
        activePreset: state.activePreset,
        dirty: isDirty(state),
        counts: model.counts,
        saveForm: saveForms.get(context) || null,
      },
      list: {
        order: model.order,
        separatorAfter: model.separatorAfter,
        hidden: model.hidden,
        forced: model.forced,
        pinned: model.pinned,
      },
      toast,
    };
  }

  function open(payload) {
    const loaded = repository.load();
    if (!loaded) return null;
    return build(payload.context, loaded.state, payload, null);
  }

  function handleSave(context, state, type, arg) {
    const { state: next, result } = savePreset(state, arg, { overwrite: type === 'confirmSave' });
    if (result === 'saved') saveForms.delete(context);
    else if (result === 'exists') saveForms.set(context, { name: normalizePresetName(arg), mode: 'confirm', error: null });
    else saveForms.set(context, { name: '', mode: 'edit', error: 'empty' });
    return next;
  }

  function act(payload) {
    const loaded = repository.load();
    if (!loaded) return null;
    const context = payload.context;
    const { type, arg } = payload.action || {};
    let state = loaded.state;
    let toast = null;

    if (type === 'openSave') {
      saveForms.set(context, { name: state.activePreset || '', mode: 'edit', error: null });
    } else if (type === 'cancelSave') {
      saveForms.delete(context);
    } else if (type === 'savePreset' || type === 'confirmSave') {
      state = handleSave(context, state, type, arg);
    } else if (STATE_ACTIONS[type]) {
      state = STATE_ACTIONS[type](state, arg);
      if (type === 'hide' && typeof arg === 'string' && arg.trim()) toast = arg.trim();
    } else {
      logger.error('GimmickListController.act', `action inconnue : ${type}`);
    }

    if (state !== loaded.state) repository.save(loaded.key, state);
    return build(context, state, payload, toast);
  }

  return { open, act };
}

module.exports = { createGimmickListController };
