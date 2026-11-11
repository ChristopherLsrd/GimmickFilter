'use strict';

// Ports : ce que les cas d'usage attendent du monde extérieur.
// GimmickCatalog.loadGimmicks() → Gimmick[]
// SaveIdentity.currentKey() → string | null (null : aucune sauvegarde chargée)
// PreferencesStore.load(key) → contenu brut | null (lève une erreur si illisible)
// PreferencesStore.save(key, state) ; PreferencesStore.quarantine(key) met le fichier de côté
const PORTS = Object.freeze({
  GimmickCatalog: Object.freeze(['loadGimmicks']),
  SaveIdentity: Object.freeze(['currentKey']),
  PreferencesStore: Object.freeze(['load', 'save', 'quarantine']),
});

function assertPort(name, impl) {
  const missing = PORTS[name].filter((method) => !impl || typeof impl[method] !== 'function');
  if (missing.length) throw new TypeError(`${name} : méthode(s) manquante(s) ${missing.join(', ')}`);
  return impl;
}

module.exports = { PORTS, assertPort };
