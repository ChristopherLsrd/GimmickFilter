'use strict';

// Textes du plugin. La langue suit celle du jeu (I18n.locale).
// Français et anglais sont complets ; toute clé manquante replie sur l'anglais.

const en = Object.freeze({
  'panel.preset': 'Filter',
  'panel.presetNone': '— None —',
  'panel.save': 'Save',
  'panel.delete': 'Delete',
  'panel.reset': 'Reset',
  'panel.presetName': 'Filter name',
  'panel.confirm': 'Confirm',
  'panel.cancel': 'Cancel',
  'panel.overwrite': 'The filter "{name}" already exists. Overwrite it?',
  'panel.overwriteButton': 'Overwrite',
  'panel.nameRequired': 'Enter a name.',
  'panel.disposition': 'Disposition',
  'disposition.all': 'All',
  'disposition.Heel': 'Heel',
  'disposition.Face': 'Face',
  'disposition.None': 'Tweener',
  'panel.match': 'Match',
  'match.all': 'All',
  'match.match': '✓ Matching',
  'match.nomatch': '✗ Not suited',
  'panel.include': 'With effects',
  'panel.exclude': 'Hide effects',
  'count.shown.one': '{count} gimmick',
  'count.shown.other': '{count} gimmicks',
  'count.pinnedFiltered.one': '{count} pinned gimmick hidden by filters',
  'count.pinnedFiltered.other': '{count} pinned gimmicks hidden by filters',
  'count.hidden.one': '{count} hidden in settings',
  'count.hidden.other': '{count} hidden in settings',
  'panel.empty': 'No gimmick matches.',
  'card.pin': 'Pin',
  'card.unpin': 'Unpin',
  'card.hide': 'Hide this gimmick',
  'card.forced': 'Shown because selected',
  'toast.hidden': '{name} hidden',
  'toast.undo': 'Undo',
  'page.title': 'Gimmick Filter',
  'page.gimmicks': 'Gimmicks',
  'page.search': 'Search gimmicks',
  'page.unhideAll': 'Unhide all',
  'page.unpinAll': 'Unpin all',
  'page.col.name': 'Name',
  'page.col.disposition': 'Disposition',
  'page.col.effects': 'Effects',
  'page.col.pinned': 'Pinned',
  'page.col.hidden': 'Hidden',
  'page.presets': 'Saved filters',
  'page.presetsEmpty': 'No saved filter yet.',
  'page.rename': 'Rename',
  'page.delete': 'Delete',
  'page.noSave': 'Load a save to set up Gimmick Filter.',
  'page.noGimmicks': 'This save has no gimmicks.',
  'page.error.empty': 'Enter a name.',
  'page.error.exists': 'A filter with this name already exists.',
});

const fr = Object.freeze({
  'panel.preset': 'Filtre',
  'panel.presetNone': '— Aucun —',
  'panel.save': 'Enregistrer',
  'panel.delete': 'Supprimer',
  'panel.reset': 'Réinitialiser',
  'panel.presetName': 'Nom du filtre',
  'panel.confirm': 'Valider',
  'panel.cancel': 'Annuler',
  'panel.overwrite': 'Le filtre « {name} » existe déjà. L\'écraser ?',
  'panel.overwriteButton': 'Écraser',
  'panel.nameRequired': 'Saisis un nom.',
  'panel.disposition': 'Disposition',
  'disposition.all': 'Toutes',
  'disposition.Heel': 'Heel',
  'disposition.Face': 'Face',
  'disposition.None': 'Tweener',
  'panel.match': 'Correspondance',
  'match.all': 'Toutes',
  'match.match': '✓ Correspondantes',
  'match.nomatch': '✗ Non pertinentes',
  'panel.include': 'Avec effets',
  'panel.exclude': 'Masquer effets',
  'count.shown.one': '{count} gimmick',
  'count.shown.other': '{count} gimmicks',
  'count.pinnedFiltered.one': '{count} épinglée cachée par les filtres',
  'count.pinnedFiltered.other': '{count} épinglées cachées par les filtres',
  'count.hidden.one': '{count} masquée par réglage',
  'count.hidden.other': '{count} masquées par réglage',
  'panel.empty': 'Aucune gimmick ne correspond.',
  'card.pin': 'Épingler',
  'card.unpin': 'Désépingler',
  'card.hide': 'Masquer cette gimmick',
  'card.forced': 'Affichée car sélectionnée',
  'toast.hidden': '{name} masquée',
  'toast.undo': 'Annuler',
  'page.title': 'Gimmick Filter',
  'page.gimmicks': 'Gimmicks',
  'page.search': 'Rechercher une gimmick',
  'page.unhideAll': 'Tout réafficher',
  'page.unpinAll': 'Tout désépingler',
  'page.col.name': 'Nom',
  'page.col.disposition': 'Disposition',
  'page.col.effects': 'Effets',
  'page.col.pinned': 'Épinglée',
  'page.col.hidden': 'Masquée',
  'page.presets': 'Filtres enregistrés',
  'page.presetsEmpty': 'Aucun filtre enregistré pour l\'instant.',
  'page.rename': 'Renommer',
  'page.delete': 'Supprimer',
  'page.noSave': 'Charge une sauvegarde pour paramétrer Gimmick Filter.',
  'page.noGimmicks': 'Cette sauvegarde n\'a aucune gimmick.',
  'page.error.empty': 'Saisis un nom.',
  'page.error.exists': 'Un filtre porte déjà ce nom.',
});

const MESSAGES = Object.freeze({ en, fr });

// Langues où 0 et 1 prennent le singulier.
const SINGULAR_BELOW_TWO = new Set(['fr', 'pt']);

function has(dict, key) {
  return Object.prototype.hasOwnProperty.call(dict, key);
}

function resolveLocale(code) {
  if (typeof code !== 'string') return 'en';
  const full = code.trim().toLowerCase();
  if (has(MESSAGES, full)) return full;
  const prefix = full.split(/[-_]/)[0];
  return has(MESSAGES, prefix) ? prefix : 'en';
}

function interpolate(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (
    params[name] === undefined || params[name] === null ? match : String(params[name])
  ));
}

function t(locale, key, params) {
  const dict = MESSAGES[resolveLocale(locale)];
  let text = String(key);
  if (has(dict, key)) text = dict[key];
  else if (has(MESSAGES.en, key)) text = MESSAGES.en[key];
  return interpolate(text, params);
}

function tCount(locale, key, count) {
  const lang = resolveLocale(locale);
  const singular = SINGULAR_BELOW_TWO.has(lang) ? count < 2 : count === 1;
  return t(locale, `${key}.${singular ? 'one' : 'other'}`, { count });
}

module.exports = { MESSAGES, resolveLocale, t, tCount };
