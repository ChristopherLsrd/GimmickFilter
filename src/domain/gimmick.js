'use strict';
const { compareNames } = require('./text');

const DATA_DISPOSITIONS = Object.freeze(['Face', 'Heel', 'None']);
const REQUIREMENT_PREFIX = 'Requires ';

function parseEffects(modifiers) {
  if (typeof modifiers !== 'string') return [];
  const seen = new Set();
  const effects = [];
  for (const part of modifiers.split(',')) {
    const effect = part.trim();
    if (effect && !seen.has(effect)) {
      seen.add(effect);
      effects.push(effect);
    }
  }
  return effects;
}

function normalizeDisposition(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return DATA_DISPOSITIONS.includes(text) ? text : 'None';
}

function toGimmick(row) {
  const name = row && typeof row.name === 'string' ? row.name.trim() : '';
  if (!name) return null;
  return Object.freeze({
    name,
    disposition: normalizeDisposition(row.dispositionPreference),
    effects: Object.freeze(parseEffects(row.modifiers)),
  });
}

function isRequirement(effect) {
  return typeof effect === 'string' && effect.startsWith(REQUIREMENT_PREFIX);
}

function listEffects(gimmicks) {
  const all = new Set();
  for (const gimmick of gimmicks) gimmick.effects.forEach((effect) => all.add(effect));
  const list = [...all];
  const requirements = list.filter(isRequirement).sort(compareNames);
  const others = list.filter((effect) => !isRequirement(effect)).sort(compareNames);
  return [...requirements, ...others];
}

module.exports = {
  DATA_DISPOSITIONS, parseEffects, normalizeDisposition, toGimmick, isRequirement, listEffects,
};
