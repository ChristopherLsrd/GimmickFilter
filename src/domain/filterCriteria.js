'use strict';
const { cleanStringList } = require('./text');

const DISPOSITIONS = Object.freeze(['all', 'Heel', 'Face', 'None']);
const MATCH_MODES = Object.freeze(['all', 'match', 'nomatch']);

function defaultCriteria() {
  return { disposition: 'all', match: 'all', include: [], exclude: [] };
}

function normalizeCriteria(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const include = cleanStringList(r.include);
  const exclude = cleanStringList(r.exclude).filter((effect) => !include.includes(effect));
  return {
    disposition: DISPOSITIONS.includes(r.disposition) ? r.disposition : 'all',
    match: MATCH_MODES.includes(r.match) ? r.match : 'all',
    include,
    exclude,
  };
}

function setDisposition(criteria, value) {
  return DISPOSITIONS.includes(value) ? { ...criteria, disposition: value } : criteria;
}

function setMatch(criteria, value) {
  return MATCH_MODES.includes(value) ? { ...criteria, match: value } : criteria;
}

function toggleIn(list, effect) {
  return list.includes(effect) ? list.filter((e) => e !== effect) : cleanStringList([...list, effect]);
}

function cleanEffect(effect) {
  return typeof effect === 'string' && effect.trim() ? effect.trim() : null;
}

function toggleInclude(criteria, effect) {
  const e = cleanEffect(effect);
  if (!e) return criteria;
  return { ...criteria, include: toggleIn(criteria.include, e), exclude: criteria.exclude.filter((x) => x !== e) };
}

function toggleExclude(criteria, effect) {
  const e = cleanEffect(effect);
  if (!e) return criteria;
  return { ...criteria, exclude: toggleIn(criteria.exclude, e), include: criteria.include.filter((x) => x !== e) };
}

function restrictToEffects(criteria, effects) {
  const known = new Set(effects);
  return {
    ...criteria,
    include: criteria.include.filter((e) => known.has(e)),
    exclude: criteria.exclude.filter((e) => known.has(e)),
  };
}

function sameCriteria(a, b) {
  const x = normalizeCriteria(a);
  const y = normalizeCriteria(b);
  return x.disposition === y.disposition
    && x.match === y.match
    && x.include.join('\n') === y.include.join('\n')
    && x.exclude.join('\n') === y.exclude.join('\n');
}

function isDefaultCriteria(criteria) {
  return sameCriteria(criteria, defaultCriteria());
}

module.exports = {
  DISPOSITIONS, MATCH_MODES, defaultCriteria, normalizeCriteria, setDisposition, setMatch,
  toggleInclude, toggleExclude, restrictToEffects, sameCriteria, isDefaultCriteria,
};
