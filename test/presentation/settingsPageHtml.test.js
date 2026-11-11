'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderPageShell, renderSettingsPage, renderNoSave } = require('../../src/presentation/settingsPageHtml');

const DATA = {
  gimmicks: [
    { name: 'Cocky', disposition: 'None', effects: ['Talking Angle Boost', 'Fast Popularity Gain'], pinned: true, hidden: false },
    { name: 'Lovable <Loser>', disposition: 'Face', effects: [], pinned: false, hidden: true },
  ],
  presets: ['Promo heel'],
  error: null,
};

test('la coquille de page a une racine identifiable', () => {
  assert.equal(renderPageShell(), '<div id="gf-page-root" class="gf-page" data-plugin-id="gimmick-filter"></div>');
});

test('une ligne par gimmick avec ses cases cochées', () => {
  const html = renderSettingsPage(DATA, 'fr');
  assert.match(html, /<tr data-gf-search="cocky talking angle boost, fast popularity gain">/);
  assert.match(html, /<td>Tweener<\/td>/);
  assert.match(html, /<input type="checkbox" data-gf-action="setPinned" data-gf-name="Cocky" checked>/);
  assert.match(html, /<input type="checkbox" data-gf-action="setHidden" data-gf-name="Cocky">/);
  assert.match(html, /<input type="checkbox" data-gf-action="setHidden" data-gf-name="Lovable &lt;Loser&gt;" checked>/);
});

test('boutons globaux et recherche', () => {
  const html = renderSettingsPage(DATA, 'fr');
  assert.match(html, /class="gf-page-search"/);
  assert.match(html, /data-gf-action="unpinAll">Tout désépingler</);
  assert.match(html, /data-gf-action="unhideAll">Tout réafficher</);
});

test('filtres enregistrés : renommer et supprimer', () => {
  const html = renderSettingsPage(DATA, 'fr');
  assert.match(html, /<input type="text" class="gf-rename-input" value="Promo heel" maxlength="60">/);
  assert.match(html, /data-gf-action="renamePreset" data-gf-from="Promo heel">Renommer</);
  assert.match(html, /data-gf-action="deletePreset" data-gf-from="Promo heel">Supprimer</);
});

test('sans filtre enregistré, un message l\'indique', () => {
  assert.match(renderSettingsPage({ ...DATA, presets: [] }, 'fr'), /Aucun filtre enregistré/);
});

test('une erreur de renommage est affichée', () => {
  assert.match(renderSettingsPage({ ...DATA, error: 'exists' }, 'fr'), /<p class="gf-error">Un filtre porte déjà ce nom\.<\/p>/);
});

test('sans gimmick, un message l\'indique', () => {
  assert.match(renderSettingsPage({ ...DATA, gimmicks: [] }, 'en'), /This save has no gimmicks\./);
});

test('renderNoSave', () => {
  assert.equal(renderNoSave('fr'), '<div class="noResults">Charge une sauvegarde pour paramétrer Gimmick Filter.</div>');
});

test('les boutons de la page utilisent les classes natives du jeu', () => {
  const { renderSettingsPage } = require('../../src/presentation/settingsPageHtml');
  const html = renderSettingsPage({ gimmicks: [], presets: ['P'], error: null }, 'fr');
  assert.match(html, /class="gf-btn button clickable secondaryButton" data-gf-action="unpinAll"/);
  assert.match(html, /class="gf-btn button clickable secondaryButton" data-gf-action="renamePreset"/);
});
