# Gimmick Filter

Plugin pour **Pro Wrestling Sim** : filtres, épingles et masquage dans les deux listes de gimmicks du jeu, la modale **Changer de gimmick** (Mon effectif) et la colonne Créatif de la **négociation de contrat**.

Le plugin est en lecture seule : il n'écrit jamais dans la base de la sauvegarde. Il s'affiche en français ou en anglais selon la langue du jeu (allemand, espagnol, italien et portugais en bonus ; anglais pour les autres langues).

## Fonctions

- **Disposition** : Toutes / Heel / Face / Tweener (gimmicks sans préférence).
- **Correspondance** : Toutes / ✓ Correspondantes (aucune exigence en rouge pour le catcheur) / ✗ Non pertinentes (au moins une exigence en rouge).
- **Avec effets** : la gimmick doit avoir tous les effets cochés.
- **Masquer effets** : la gimmick ne doit avoir aucun des effets cochés. Un effet ne peut pas être coché dans les deux groupes.
- **Filtres enregistrés** : Enregistrer, Supprimer, Réinitialiser. Un « * » signale un filtre modifié depuis son chargement.
- **Épingles** (★) : les gimmicks épinglées passent en tête, au-dessus d'un séparateur.
- **Masquage** (⊘) : la gimmick disparaît des listes ; un bandeau permet d'annuler pendant 5 secondes.
- **Page « Gimmick Filter »** (menu latéral) : épingler ou masquer en lot, tout réafficher, renommer ou supprimer les filtres enregistrés.

La gimmick actuellement sélectionnée reste toujours visible, avec un marqueur. Les réglages sont enregistrés par sauvegarde dans `data/prefs-<sauvegarde>.json`.

## Développement

Clean architecture sans dépendance externe : `src/domain` (règles pures), `src/application` (cas d'usage et ports), `src/presentation` (rendu HTML et textes), `src/adapters` (jeu, base, stockage). `test/architecture.test.js` vérifie la règle de dépendance.

Tests (Node 24) :

```powershell
npm test
```

Pour que le jeu charge le plugin directement depuis le dépôt (Windows) :

```powershell
New-Item -ItemType Junction -Path "$env:APPDATA\ProWrestlingSimulator\plugins\gimmick-filter" -Target "F:\Dev\GimmickFilter"
```

## Test en jeu

- [ ] Changer de gimmick : le panneau apparaît au-dessus de la liste.
- [ ] Disposition et Correspondance filtrent, en cohérence avec les coches vertes et rouges du jeu.
- [ ] Avec effets (deux effets cochés) puis Masquer effets : le compteur suit.
- [ ] ★ épingle sans sélectionner la carte ; séparateur sous les épinglées.
- [ ] ⊘ masque, le bandeau « Annuler » restaure la gimmick.
- [ ] La gimmick sélectionnée filtrée reste visible avec son marqueur.
- [ ] La recherche texte du jeu se combine avec les filtres.
- [ ] Enregistrer un filtre, le modifier (« * »), l'écraser, le supprimer, Réinitialiser.
- [ ] Négociation de contrat : mêmes filtres, correspondance du catcheur négocié.
- [ ] Page Gimmick Filter : cases Épinglée / Masquée, Tout réafficher, renommer un filtre.
- [ ] Deux sauvegardes différentes gardent des réglages séparés.
- [ ] Désactiver le plugin : la liste du jeu revient à son état d'origine ; le réactiver.
- [ ] Rechargement à chaud : pas de panneau en double.
- [ ] Rouvrir la page Gimmick Filter après un rechargement à chaud affiche la liste (pas un indicateur de chargement figé).
