'use strict';

function unknownRequirements() {
  return { known: false, unmet: new Set() };
}

function toRequirements(raw) {
  if (!raw || raw.known !== true) return unknownRequirements();
  const unmet = Array.isArray(raw.unmet) ? raw.unmet.filter((name) => typeof name === 'string') : [];
  return { known: true, unmet: new Set(unmet) };
}

function passesFilter(gimmick, criteria, requirements) {
  if (criteria.disposition !== 'all' && gimmick.disposition !== criteria.disposition) return false;
  if (criteria.match !== 'all' && requirements.known) {
    const unmet = requirements.unmet.has(gimmick.name);
    if (criteria.match === 'match' && unmet) return false;
    if (criteria.match === 'nomatch' && !unmet) return false;
  }
  if (!criteria.include.every((effect) => gimmick.effects.includes(effect))) return false;
  if (criteria.exclude.some((effect) => gimmick.effects.includes(effect))) return false;
  return true;
}

module.exports = { unknownRequirements, toRequirements, passesFilter };
