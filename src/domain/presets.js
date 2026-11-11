'use strict';
const { compareNames } = require('./text');
const { defaultCriteria, normalizeCriteria, sameCriteria } = require('./filterCriteria');

function normalizePresetName(name) {
  return typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
}

function findPreset(state, name) {
  const key = normalizePresetName(name).toLowerCase();
  if (!key) return null;
  return state.presets.find((preset) => preset.name.toLowerCase() === key) || null;
}

function sortPresets(presets) {
  return presets.slice().sort((a, b) => compareNames(a.name, b.name));
}

function savePreset(state, name, { overwrite = false } = {}) {
  const clean = normalizePresetName(name);
  if (!clean) return { state, result: 'empty' };
  const existing = findPreset(state, clean);
  if (existing && !overwrite) return { state, result: 'exists' };
  const preset = { name: existing ? existing.name : clean, criteria: normalizeCriteria(state.current) };
  const others = state.presets.filter((p) => p !== existing);
  return {
    state: { ...state, presets: sortPresets([...others, preset]), activePreset: preset.name },
    result: 'saved',
  };
}

function deletePreset(state, name) {
  const preset = findPreset(state, name);
  if (!preset) return state;
  return {
    ...state,
    presets: state.presets.filter((p) => p !== preset),
    activePreset: state.activePreset === preset.name ? null : state.activePreset,
  };
}

function renamePreset(state, from, to) {
  const preset = findPreset(state, from);
  if (!preset) return { state, result: 'missing' };
  const clean = normalizePresetName(to);
  if (!clean) return { state, result: 'empty' };
  const other = findPreset(state, clean);
  if (other && other !== preset) return { state, result: 'exists' };
  const renamed = { ...preset, name: clean };
  return {
    state: {
      ...state,
      presets: sortPresets(state.presets.map((p) => (p === preset ? renamed : p))),
      activePreset: state.activePreset === preset.name ? clean : state.activePreset,
    },
    result: 'renamed',
  };
}

function applyPreset(state, name) {
  if (!normalizePresetName(name)) return { ...state, activePreset: null };
  const preset = findPreset(state, name);
  if (!preset) return state;
  return { ...state, current: normalizeCriteria(preset.criteria), activePreset: preset.name };
}

function resetCriteria(state) {
  return { ...state, current: defaultCriteria(), activePreset: null };
}

function updateCriteria(state, fn) {
  return { ...state, current: normalizeCriteria(fn(state.current)) };
}

function isDirty(state) {
  const preset = state.activePreset ? findPreset(state, state.activePreset) : null;
  return preset ? !sameCriteria(preset.criteria, state.current) : false;
}

module.exports = {
  normalizePresetName, findPreset, savePreset, deletePreset, renamePreset, applyPreset,
  resetCriteria, updateCriteria, isDirty,
};
