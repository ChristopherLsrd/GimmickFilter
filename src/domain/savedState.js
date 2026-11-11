'use strict';
const { cleanStringList } = require('./text');
const { defaultCriteria, normalizeCriteria } = require('./filterCriteria');

const STATE_VERSION = 1;

function emptyState() {
  return {
    version: STATE_VERSION, pinned: [], hidden: [], current: defaultCriteria(), activePreset: null, presets: [],
  };
}

function normalizePresets(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const presets = [];
  for (const preset of value) {
    if (!preset || typeof preset.name !== 'string') continue;
    const name = preset.name.trim().replace(/\s+/g, ' ');
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    presets.push({ name, criteria: normalizeCriteria(preset.criteria) });
  }
  return presets;
}

function normalizeState(raw) {
  if (raw === null || raw === undefined) return { state: emptyState(), ok: true };
  if (typeof raw !== 'object' || Array.isArray(raw) || raw.version !== STATE_VERSION) {
    return { state: emptyState(), ok: false };
  }
  const pinned = cleanStringList(raw.pinned);
  const hidden = cleanStringList(raw.hidden).filter((name) => !pinned.includes(name));
  const presets = normalizePresets(raw.presets);
  const activeKey = typeof raw.activePreset === 'string' ? raw.activePreset.trim().toLowerCase() : '';
  const active = presets.find((preset) => preset.name.toLowerCase() === activeKey);
  return {
    state: {
      version: STATE_VERSION,
      pinned,
      hidden,
      current: normalizeCriteria(raw.current),
      activePreset: active ? active.name : null,
      presets,
    },
    ok: true,
  };
}

module.exports = { STATE_VERSION, emptyState, normalizeState };
