'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { MESSAGES, resolveLocale, t, tCount } = require('../../src/presentation/i18n');

test('le français et l\'anglais ont exactement les mêmes clés', () => {
  assert.deepEqual(Object.keys(MESSAGES.fr).sort(), Object.keys(MESSAGES.en).sort());
});

test('resolveLocale reconnaît le code complet puis le préfixe', () => {
  assert.equal(resolveLocale('fr'), 'fr');
  assert.equal(resolveLocale('FR-ca'), 'fr');
  assert.equal(resolveLocale('en_GB'), 'en');
  assert.equal(resolveLocale('xx'), 'en');
  assert.equal(resolveLocale(null), 'en');
});

test('t traduit et interpole', () => {
  assert.equal(t('fr', 'toast.hidden', { name: 'Cocky' }), 'Cocky masquée');
  assert.equal(t('en', 'toast.hidden', { name: 'Cocky' }), 'Cocky hidden');
});

test('t replie sur l\'anglais pour une langue inconnue, puis sur la clé', () => {
  assert.equal(t('tr', 'panel.reset'), 'Reset');
  assert.equal(t('fr', 'cle.inexistante'), 'cle.inexistante');
});

test('t garde un paramètre manquant tel quel', () => {
  assert.equal(t('en', 'toast.hidden', {}), '{name} hidden');
});

test('tCount choisit le singulier ou le pluriel', () => {
  assert.equal(tCount('en', 'count.shown', 1), '1 gimmick');
  assert.equal(tCount('en', 'count.shown', 0), '0 gimmicks');
  assert.equal(tCount('fr', 'count.shown', 0), '0 gimmick');
  assert.equal(tCount('fr', 'count.shown', 12), '12 gimmicks');
});

test('chaque langue bonus a exactement les clés de l\'anglais', () => {
  for (const lang of ['de', 'es', 'it', 'pt']) {
    assert.deepEqual(Object.keys(MESSAGES[lang]).sort(), Object.keys(MESSAGES.en).sort(), lang);
  }
});

test('les langues bonus sont utilisées', () => {
  assert.equal(t('de', 'panel.reset'), 'Zurücksetzen');
  assert.equal(t('es-MX', 'panel.reset'), 'Restablecer');
  assert.equal(t('it', 'toast.undo'), 'Annulla');
  assert.equal(tCount('pt', 'count.shown', 0), '0 gimmick');
});
