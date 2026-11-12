# Atelier ECGEB352

Application d'étude interactive pour le travail de groupe d'économétrie ECGEB352 (2026-2027) :
les 41 questions de l'énoncé expliquées depuis zéro, les chiffres recalculés sur les données réelles,
la comparaison de deux corrigés (ChatGPT et Claude) et un espace pour rédiger sa propre version.

## Ouvrir l'application

Double-clique sur `index.html` : tout est dans ce seul fichier (aucune installation, aucun serveur,
fonctionne hors ligne). Les notes et les choix sont enregistrés dans le navigateur ; la page
« Mon rapport » permet de les exporter.

## Modifier le contenu

Le texte se trouve dans `src/content/*.md` (un fichier par page, les parties sont découpées en
`p1a.md`, `p1b.md`…). Après une modification :

```bash
node build.mjs
```

| Dossier | Contenu |
|---|---|
| `src/content/` | Textes : accueil, bases, parties 1 à 3, comparatif, atelier R, glossaire |
| `src/js/` | Moteur (rendu, navigation, sauvegarde), statistiques, graphiques, outils interactifs |
| `src/data/` | Données réduites tirées des quatre fichiers du travail |
| `outils/extraire_donnees.R` | Script qui a produit `src/data/` à partir des fichiers bruts |
| `tests/` | Vérifications automatiques |

## Vérifier

```bash
node tests/verifier.mjs
```

compare les calculs JavaScript des outils interactifs aux résultats de R (48 contrôles).

```bash
node tests/fumee.cjs
```

ouvre toutes les pages dans Chromium et signale toute erreur (nécessite Playwright).

## Données

Statbel (ventes immobilières et statistique fiscale des revenus, 2023), recensement américain de 1980
(Angrist et Evans, 1998) et panel de localités du Burkina Faso (Schmidt et Moradi, 2026). Les fichiers
bruts ne sont pas dans ce dépôt ; seules des données réduites servent aux graphiques.

## Consigne du cours

L'énoncé précise que l'usage d'outils d'intelligence artificielle n'est pas autorisé pour le travail
remis et qu'un oral par groupe suit la remise. Cet atelier sert à comprendre la matière et à pouvoir
tout refaire et tout expliquer soi-même.
