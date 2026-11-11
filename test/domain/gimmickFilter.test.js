'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { passesFilter, toRequirements, unknownRequirements } = require('../../src/domain/gimmickFilter');
const { defaultCriteria } = require('../../src/domain/filterCriteria');
const { toGimmick } = require('../../src/domain/gimmick');

const COCKY = toGimmick({ name: 'Cocky', dispositionPreference: 'None', modifiers: 'Requires Entertainment Skill,Talking Angle Boost,Fast Popularity Gain' });
const HEEL = toGimmick({ name: 'Classic Heel', dispositionPreference: 'Heel', modifiers: 'Slow Popularity Gain,Slow Popularity Loss' });
const COMEDY = toGimmick({ name: 'Comedy Character', dispositionPreference: 'None', modifiers: 'Fast Popularity Gain,Capped Popularity' });

const c = (over) => ({ ...defaultCriteria(), ...over });
const none = unknownRequirements();

test('sans critère, tout passe', () => {
  [COCKY, HEEL, COMEDY].forEach((g) => assert.equal(passesFilter(g, defaultCriteria(), none), true));
});

test('la disposition est une égalité stricte', () => {
  assert.equal(passesFilter(HEEL, c({ disposition: 'Heel' }), none), true);
  assert.equal(passesFilter(COCKY, c({ disposition: 'Heel' }), none), false);
  assert.equal(passesFilter(COCKY, c({ disposition: 'None' }), none), true);
  assert.equal(passesFilter(HEEL, c({ disposition: 'None' }), none), false);
});

test('correspondance : match exclut les gimmicks avec une exigence en rouge', () => {
  const req = toRequirements({ known: true, unmet: ['Cocky'] });
  assert.equal(passesFilter(COCKY, c({ match: 'match' }), req), false);
  assert.equal(passesFilter(HEEL, c({ match: 'match' }), req), true);
});

test('correspondance : nomatch ne garde que les gimmicks avec une exigence en rouge', () => {
  const req = toRequirements({ known: true, unmet: ['Cocky'] });
  assert.equal(passesFilter(COCKY, c({ match: 'nomatch' }), req), true);
  assert.equal(passesFilter(HEEL, c({ match: 'nomatch' }), req), false);
});

test('correspondance ignorée quand le statut est inconnu', () => {
  assert.equal(passesFilter(COCKY, c({ match: 'nomatch' }), none), true);
  assert.equal(passesFilter(HEEL, c({ match: 'nomatch' }), toRequirements(null)), true);
});

test('avec effets : la gimmick doit avoir tous les effets (ET)', () => {
  assert.equal(passesFilter(COCKY, c({ include: ['Fast Popularity Gain', 'Talking Angle Boost'] }), none), true);
  assert.equal(passesFilter(COMEDY, c({ include: ['Fast Popularity Gain', 'Talking Angle Boost'] }), none), false);
});

test('masquer effets : la gimmick ne doit en avoir aucun', () => {
  assert.equal(passesFilter(COMEDY, c({ exclude: ['Capped Popularity'] }), none), false);
  assert.equal(passesFilter(COCKY, c({ exclude: ['Capped Popularity', 'Added Cost'] }), none), true);
});

test('tous les critères se combinent', () => {
  const req = toRequirements({ known: true, unmet: [] });
  const criteria = c({ disposition: 'None', match: 'match', include: ['Fast Popularity Gain'], exclude: ['Capped Popularity'] });
  assert.equal(passesFilter(COCKY, criteria, req), true);
  assert.equal(passesFilter(COMEDY, criteria, req), false);
  assert.equal(passesFilter(HEEL, criteria, req), false);
});

test('toRequirements ignore les valeurs qui ne sont pas des noms', () => {
  const req = toRequirements({ known: true, unmet: ['Cocky', 3, null] });
  assert.deepEqual([...req.unmet], ['Cocky']);
  assert.equal(toRequirements({ known: 'yes', unmet: ['Cocky'] }).known, false);
});
