'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderPanel, renderToast, cardLabels } = require('../../src/presentation/panelHtml');
const { defaultCriteria } = require('../../src/domain/filterCriteria');

const base = (over = {}) => ({
  effects: ['Requires Wrestling Skill', 'Capped Popularity', 'Talking Angle Boost'],
  criteria: defaultCriteria(),
  presets: [],
  activePreset: null,
  dirty: false,
  counts: { shown: 12, pinnedFiltered: 0, hiddenBySetting: 0 },
  saveForm: null,
  locale: 'fr',
  ...over,
});

test('la racine porte la classe, l\'id du plugin et la langue', () => {
  const html = renderPanel(base());
  assert.match(html, /^<div class="gf-panel" data-plugin-id="gimmick-filter" lang="fr">/);
});

test('tous les effets sont proposés dans les deux groupes', () => {
  const html = renderPanel(base());
  for (const effect of ['Requires Wrestling Skill', 'Capped Popularity', 'Talking Angle Boost']) {
    assert.match(html, new RegExp(`data-gf-action="toggleInclude" data-gf-arg="${effect}"`));
    assert.match(html, new RegExp(`data-gf-action="toggleExclude" data-gf-arg="${effect}"`));
  }
});

test('un effet inclus est actif d\'un côté et désactivé de l\'autre', () => {
  const html = renderPanel(base({ criteria: { ...defaultCriteria(), include: ['Talking Angle Boost'], exclude: ['Capped Popularity'] } }));
  assert.match(html, /class="gf-chip gf-inc gf-on" data-gf-action="toggleInclude" data-gf-arg="Talking Angle Boost" aria-pressed="true"/);
  assert.match(html, /data-gf-action="toggleExclude" data-gf-arg="Talking Angle Boost"[^>]*disabled/);
  assert.match(html, /class="gf-chip gf-exc gf-on" data-gf-action="toggleExclude" data-gf-arg="Capped Popularity"/);
  assert.match(html, /data-gf-action="toggleInclude" data-gf-arg="Capped Popularity"[^>]*disabled/);
});

test('disposition et correspondance : la valeur courante est active', () => {
  const html = renderPanel(base({ criteria: { ...defaultCriteria(), disposition: 'None', match: 'nomatch' } }));
  assert.match(html, /class="gf-seg-btn gf-on" data-gf-action="setDisposition" data-gf-arg="None" aria-pressed="true">None</);
  assert.match(html, /class="gf-seg-btn gf-on" data-gf-action="setMatch" data-gf-arg="nomatch" aria-pressed="true">✗ Non pertinentes</);
  assert.match(html, /class="gf-seg-btn" data-gf-action="setDisposition" data-gf-arg="all">Toutes</);
});

test('la liste des filtres marque le filtre actif modifié d\'un astérisque', () => {
  const html = renderPanel(base({ presets: ['Promo heel', 'Faces'], activePreset: 'Promo heel', dirty: true }));
  assert.match(html, /<select class="gf-select" data-gf-change="applyPreset"><option value="">— Aucun —<\/option>/);
  assert.match(html, /<option value="Promo heel" selected>Promo heel\*<\/option>/);
  assert.match(html, /<option value="Faces">Faces<\/option>/);
});

test('Supprimer est désactivé sans filtre actif', () => {
  assert.match(renderPanel(base()), /data-gf-action="deletePreset" disabled/);
  assert.doesNotMatch(renderPanel(base({ presets: ['P'], activePreset: 'P' })), /data-gf-action="deletePreset" disabled/);
});

test('formulaire d\'enregistrement : champ, validation et erreur', () => {
  const html = renderPanel(base({ saveForm: { name: 'Promo heel', mode: 'edit', error: 'empty' } }));
  assert.match(html, /<input type="text" class="gf-preset-name" value="Promo heel"/);
  assert.match(html, /data-gf-action="savePreset" data-gf-input="\.gf-preset-name"/);
  assert.match(html, /data-gf-action="cancelSave"/);
  assert.match(html, /<span class="gf-error">Saisis un nom\.<\/span>/);
});

test('confirmation d\'écrasement', () => {
  const html = renderPanel(base({ saveForm: { name: 'Promo heel', mode: 'confirm', error: null } }));
  assert.match(html, /Le filtre « Promo heel » existe déjà/);
  assert.match(html, /data-gf-action="confirmSave" data-gf-arg="Promo heel">Écraser</);
});

test('le compteur n\'affiche que les parties utiles', () => {
  assert.match(renderPanel(base()), /<div class="gf-count">12 gimmicks<\/div>/);
  const html = renderPanel(base({ counts: { shown: 1, pinnedFiltered: 2, hiddenBySetting: 3 } }));
  assert.match(html, /1 gimmick · 2 épinglées cachées par les filtres · 3 masquées par réglage/);
});

test('liste vide : message et bouton Réinitialiser', () => {
  const html = renderPanel(base({ counts: { shown: 0, pinnedFiltered: 0, hiddenBySetting: 0 } }));
  assert.match(html, /<div class="gf-empty">Aucune gimmick ne correspond\.\s*<button/);
});

test('les noms sont échappés', () => {
  const html = renderPanel(base({ effects: ['<b>X</b>'], presets: ['"A"'], activePreset: '"A"' }));
  assert.doesNotMatch(html, /<b>X<\/b>/);
  assert.match(html, /&lt;b&gt;X&lt;\/b&gt;/);
  assert.match(html, /value="&quot;A&quot;"/);
});

test('l\'anglais est utilisé pour une autre langue', () => {
  assert.match(renderPanel(base({ locale: 'ja' })), /lang="en"[\s\S]*Reset/);
});

test('renderToast propose d\'annuler le masquage', () => {
  const html = renderToast('Lucha <Masked>', 'fr');
  assert.match(html, /^<div class="gf-toast" data-plugin-id="gimmick-filter">/);
  assert.match(html, /Lucha &lt;Masked&gt; masquée/);
  assert.match(html, /data-gf-action="unhide" data-gf-arg="Lucha &lt;Masked&gt;">Annuler</);
});

test('cardLabels', () => {
  assert.deepEqual(cardLabels('fr'), {
    pin: 'Épingler', unpin: 'Désépingler', hide: 'Masquer cette gimmick', forced: 'Affichée car sélectionnée',
  });
});

test('les boutons d\'action utilisent les classes natives du jeu', () => {
  const html = renderPanel(base());
  assert.match(html, /class="gf-btn button clickable secondaryButton"[^>]*data-gf-action="reset"/);
  assert.match(html, /class="gf-btn button disabled"[^>]*data-gf-action="deletePreset" disabled/);
});

test('barre fixe puis corps : le sélecteur et le bouton sont dans la barre, les puces dans le corps', () => {
  const html = renderPanel(base());
  const bar = html.indexOf('<div class="gf-row gf-bar">');
  const body = html.indexOf('<div class="gf-body">');
  assert.ok(bar > 0 && body > bar);
  const barHtml = html.slice(bar, body);
  assert.match(barHtml, /<select class="gf-select" data-gf-change="applyPreset">/);
  assert.match(barHtml, /<button type="button" class="gf-btn gf-toggle button clickable secondaryButton" data-gf-toggle aria-expanded="false">Filtres<\/button>/);
  assert.match(barHtml, /class="gf-count"/);
  const bodyHtml = html.slice(body);
  assert.match(bodyHtml, /class="gf-row gf-chips"/);
  assert.match(bodyHtml, /data-gf-action="openSave"/);
  assert.match(bodyHtml, /data-gf-action="setDisposition"/);
  assert.doesNotMatch(barHtml, /gf-chips|setDisposition/);
});

test('le libellé du bouton compte les filtres actifs', () => {
  const some = renderPanel(base({ criteria: { ...defaultCriteria(), disposition: 'Heel', match: 'match', include: ['Talking Angle Boost'] } }));
  assert.match(some, /data-gf-toggle aria-expanded="false">Filtres \(3\)<\/button>/);
  assert.match(renderPanel(base()), /data-gf-toggle aria-expanded="false">Filtres<\/button>/);
});

test('le résumé n\'existe qu\'avec des filtres et porte une puce retirable par filtre', () => {
  assert.doesNotMatch(renderPanel(base()), /gf-summary/);
  const html = renderPanel(base({ criteria: { ...defaultCriteria(), disposition: 'Heel', match: 'match', include: ['Talking Angle Boost'], exclude: ['Capped Popularity'] } }));
  const summary = html.slice(html.indexOf('gf-summary'), html.indexOf('<div class="gf-body">'));
  assert.match(summary, /class="gf-chip gf-inc" data-gf-action="setDisposition" data-gf-arg="all">Heel ×</);
  assert.match(summary, /class="gf-chip gf-inc" data-gf-action="setMatch" data-gf-arg="all">✓ Pertinentes ×|data-gf-action="setMatch" data-gf-arg="all">[^<]* ×</);
  assert.match(summary, /class="gf-chip gf-inc" data-gf-action="toggleInclude" data-gf-arg="Talking Angle Boost">Talking Angle Boost ×</);
  assert.match(summary, /class="gf-chip gf-exc" data-gf-action="toggleExclude" data-gf-arg="Capped Popularity">Capped Popularity ×</);
  assert.equal(summary.split('<button').length - 1, 4);
});

test('le bloc liste vide reste hors du corps repliable', () => {
  const html = renderPanel(base({ counts: { shown: 0, pinnedFiltered: 0, hiddenBySetting: 0 } }));
  assert.ok(html.indexOf('gf-empty') > html.indexOf('<div class="gf-body">'));
  const bodyEnd = html.indexOf('<div class="gf-empty">');
  const body = html.slice(html.indexOf('<div class="gf-body">'), bodyEnd);
  assert.match(body, /<\/div>$/);
});

const MANY = ['Video Angle Boost', 'Added Cost', 'Match Boost', 'Fast Fan Loss', 'Capped Popularity', 'Talking Angle Boost', 'Attack Angle Boost'];

function chipRowHtml(html, row) {
  const start = html.indexOf(`data-gf-row="${row}"`);
  assert.ok(start >= 0, `rangée ${row} absente`);
  return html.slice(start, html.indexOf('</div>', start));
}

test('les effets sont triés par ordre alphabétique, seuls les 5 premiers visibles au repos', () => {
  const row = chipRowHtml(renderPanel(base({ effects: MANY })), 'include');
  const order = [...row.matchAll(/data-gf-arg="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ['Added Cost', 'Attack Angle Boost', 'Capped Popularity', 'Fast Fan Loss', 'Match Boost', 'Talking Angle Boost', 'Video Angle Boost']);
  const extras = [...row.matchAll(/class="gf-chip gf-extra"[^>]*data-gf-arg="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(extras, ['Talking Angle Boost', 'Video Angle Boost']);
  assert.match(row, /data-gf-more[^>]*>.*Voir plus.*Voir moins/);
});

test('un effet actif au-delà des 5 premiers reste visible', () => {
  const html = renderPanel(base({ effects: MANY, criteria: { ...defaultCriteria(), exclude: ['Video Angle Boost'] } }));
  const row = chipRowHtml(html, 'exclude');
  assert.doesNotMatch(row, /gf-extra[^>]*data-gf-arg="Video Angle Boost"/);
  assert.match(row, /data-gf-arg="Talking Angle Boost"/);
});

test('pas de bouton voir plus avec 5 effets ou moins', () => {
  const row = chipRowHtml(renderPanel(base()), 'include');
  assert.doesNotMatch(row, /data-gf-more/);
  assert.doesNotMatch(row, /gf-extra/);
});

test('le bouton Réinitialiser est dans la barre, juste après le bouton Filtres', () => {
  const html = renderPanel(base());
  const bar = html.slice(html.indexOf('gf-bar'), html.indexOf('gf-body'));
  assert.match(bar, /data-gf-toggle[^>]*>[^<]*<\/button><button[^>]*data-gf-action="reset"/);
  const body = html.slice(html.indexOf('gf-body'));
  assert.doesNotMatch(body.slice(0, body.indexOf('gf-chips')), /data-gf-action="reset"/);
});
