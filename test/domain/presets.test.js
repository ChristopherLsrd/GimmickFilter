'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { emptyState } = require('../../src/domain/savedState');
const { defaultCriteria, setDisposition, toggleInclude } = require('../../src/domain/filterCriteria');
const {
  normalizePresetName, findPreset, savePreset, deletePreset, renamePreset, applyPreset,
  resetCriteria, updateCriteria, isDirty,
} = require('../../src/domain/presets');

const heelState = () => updateCriteria(emptyState(), (c) => setDisposition(c, 'Heel'));

test('normalizePresetName retire et réduit les espaces', () => {
  assert.equal(normalizePresetName('  Promo   heel '), 'Promo heel');
  assert.equal(normalizePresetName(null), '');
});

test('savePreset enregistre les critères courants et rend le filtre actif', () => {
  const { state, result } = savePreset(heelState(), ' Promo heel ');
  assert.equal(result, 'saved');
  assert.deepEqual(state.presets, [{ name: 'Promo heel', criteria: { ...defaultCriteria(), disposition: 'Heel' } }]);
  assert.equal(state.activePreset, 'Promo heel');
});

test('savePreset refuse un nom vide', () => {
  const s = heelState();
  assert.deepEqual(savePreset(s, '   '), { state: s, result: 'empty' });
});

test('savePreset signale un nom existant, sans tenir compte de la casse', () => {
  const s = savePreset(heelState(), 'Promo heel').state;
  assert.equal(savePreset(s, 'PROMO HEEL').result, 'exists');
});

test('savePreset avec overwrite écrase en gardant le nom d\'origine', () => {
  const s = savePreset(heelState(), 'Promo heel').state;
  const changed = updateCriteria(s, (c) => setDisposition(c, 'Face'));
  const { state, result } = savePreset(changed, 'promo heel', { overwrite: true });
  assert.equal(result, 'saved');
  assert.equal(state.presets.length, 1);
  assert.equal(state.presets[0].name, 'Promo heel');
  assert.equal(state.presets[0].criteria.disposition, 'Face');
});

test('les filtres sont triés par nom', () => {
  let s = savePreset(heelState(), 'Zeta').state;
  s = savePreset(s, 'alpha').state;
  assert.deepEqual(s.presets.map((p) => p.name), ['alpha', 'Zeta']);
});

test('findPreset ignore la casse', () => {
  const s = savePreset(heelState(), 'Promo heel').state;
  assert.equal(findPreset(s, 'promo HEEL').name, 'Promo heel');
  assert.equal(findPreset(s, 'autre'), null);
});

test('deletePreset retire le filtre et oublie le filtre actif', () => {
  const s = savePreset(heelState(), 'Promo heel').state;
  const d = deletePreset(s, 'promo heel');
  assert.deepEqual(d.presets, []);
  assert.equal(d.activePreset, null);
  assert.equal(d.current.disposition, 'Heel');
});

test('deletePreset d\'un filtre inconnu ne change rien', () => {
  const s = heelState();
  assert.equal(deletePreset(s, 'X'), s);
});

test('renamePreset renomme et suit le filtre actif', () => {
  const s = savePreset(heelState(), 'Promo heel').state;
  const { state, result } = renamePreset(s, 'Promo heel', 'Heels');
  assert.equal(result, 'renamed');
  assert.deepEqual(state.presets.map((p) => p.name), ['Heels']);
  assert.equal(state.activePreset, 'Heels');
});

test('renamePreset refuse un nom vide, pris ou un filtre absent', () => {
  let s = savePreset(heelState(), 'A').state;
  s = savePreset(s, 'B').state;
  assert.equal(renamePreset(s, 'A', ' ').result, 'empty');
  assert.equal(renamePreset(s, 'A', 'b').result, 'exists');
  assert.equal(renamePreset(s, 'Z', 'C').result, 'missing');
  assert.equal(renamePreset(s, 'A', 'a').result, 'renamed');
});

test('applyPreset remplace les critères courants', () => {
  const saved = savePreset(heelState(), 'Promo heel').state;
  const reset = resetCriteria(saved);
  const applied = applyPreset(reset, 'promo heel');
  assert.equal(applied.current.disposition, 'Heel');
  assert.equal(applied.activePreset, 'Promo heel');
});

test('applyPreset avec un nom vide désélectionne sans toucher aux critères', () => {
  const saved = savePreset(heelState(), 'Promo heel').state;
  const none = applyPreset(saved, '');
  assert.equal(none.activePreset, null);
  assert.equal(none.current.disposition, 'Heel');
  assert.equal(applyPreset(saved, 'Inconnu'), saved);
});

test('resetCriteria remet les critères par défaut et oublie le filtre actif', () => {
  const s = resetCriteria(savePreset(heelState(), 'P').state);
  assert.deepEqual(s.current, defaultCriteria());
  assert.equal(s.activePreset, null);
  assert.equal(s.presets.length, 1);
});

test('isDirty signale un filtre actif modifié', () => {
  const s = savePreset(heelState(), 'P').state;
  assert.equal(isDirty(s), false);
  assert.equal(isDirty(updateCriteria(s, (c) => toggleInclude(c, 'Match Boost'))), true);
  assert.equal(isDirty(heelState()), false);
});
