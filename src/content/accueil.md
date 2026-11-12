# Comprendre, refaire et défendre le travail d'économétrie

>> Trois enquêtes, 41 questions, 141 sous-questions. Pour chacune : la réponse, le raisonnement expliqué depuis zéro, les chiffres recalculés sur tes fichiers, ce qu'ont fait ChatGPT et Claude, et un espace pour écrire ta propre version.

{{w:reprise}}

## Les trois enquêtes

{{w:cartes-parties}}

## Le fil rouge : de l'association à la cause

Les trois parties posent la même question de fond : **quand a-t-on le droit de dire qu'une chose en cause une autre ?** Chaque partie utilise un outil plus ambitieux que la précédente.

| Partie | Ce qu'on compare | L'outil | Ce qu'on a le droit de conclure |
|---|---|---|---|
| 1. Communes belges | Des communes riches et des communes pauvres, la même année | Régression (MCO), logarithmes, indicatrices | Une **association** : les communes plus riches ont des maisons plus chères. Pas un effet causal. |
| 2. Mères américaines | Des mères dont les deux premiers enfants sont de même sexe ou non | Variables instrumentales (VI, 2SLS) | Un **effet causal**, mais seulement si l'instrument est valide, et seulement pour certaines mères. |
| 3. Localités burkinabè | L'évolution de localités électrifiées tôt et de localités électrifiées tard | Double différence, effets fixes | Un **effet causal**, si les deux groupes auraient évolué de la même façon sans le réseau. |

Si tu retiens cela, tu as déjà la colonne vertébrale de l'oral : dans chaque partie, on te demandera *ce que tu mesures*, *à quelle condition c'est un effet causal*, et *ce qui pourrait fausser le résultat*.

## Comment une question est présentée

Chaque sous-question suit le même plan, toujours dans le même ordre.

| Bloc | À quoi il sert |
|---|---|
| **La réponse en bref** | Ce que tu dois pouvoir dire en deux phrases, chiffre compris. |
| **Comprendre pas à pas** | Le raisonnement sans prérequis : d'où vient l'idée, pourquoi cette formule, comment lire le résultat. Les mots soulignés en pointillés ouvrent leur définition. |
| **Les chiffres** | Les tableaux et les valeurs, tels que R les produit sur tes fichiers. |
| **Le code R** | Les lignes du script qui donnent ces chiffres, commentées une par une. |
| **ChatGPT et Claude** | Ce que chacun a fait, là où ils diffèrent, et un conseil argumenté. Quand les deux sont d'accord, c'est dit en une ligne. |
| **Ma version pour le rapport** | Tu coches le raisonnement qui te convainc, tu le réécris avec tes mots, tu coches « je sais l'expliquer ». Tout est enregistré. |

Beaucoup de questions contiennent en plus un **outil interactif** : un graphique construit sur les vraies données, que tu peux manipuler pour voir ce que fait une hypothèse ou un choix de méthode.

## Par où commencer

1. **Tu pars de zéro ?** Lis d'abord [les bases](#bases) : dix leçons courtes, dans l'ordre, avec un outil à manipuler dans presque chacune. Compte une heure et demie.
2. **Avance partie par partie**, question par question. Ne saute pas la partie 1 : elle installe tout le vocabulaire (coefficient, erreur-type, logarithme, biais de variable omise).
3. **À chaque sous-question, écris ta version.** C'est le meilleur test : si tu n'arrives pas à la reformuler sans regarder, relis le bloc « Comprendre pas à pas ».
4. **Refais le code** avec l'[atelier R](#atelier), en comparant tes résultats aux valeurs de contrôle.
5. **Rassemble** tes choix et tes textes dans [Mon rapport](#choix), puis exporte-les.
6. **Entraîne-toi pour l'oral** avec les [cartes de questions](#oral).

## Ce qui a été vérifié pour construire cet atelier

:::verif Vérifications faites sur tes fichiers
- **Les deux scripts R tournent du début à la fin** sans erreur (R 4.3.3) et donnent **les mêmes chiffres** sur tous les résultats principaux : 551 communes, élasticités 1,444 et 1,608, effet 2SLS de −5,46 semaines, double différence de 0,380.
- **Les outils interactifs recalculent tout en direct** à partir des données réelles. Leurs résultats sont comparés automatiquement à ceux de R (48 contrôles, tous identiques).
- **Une erreur de date commune aux deux versions** : la fusion de Bastogne et Bertogne a pris effet le **2 décembre 2024**, et non le 1er (voir la question 1.1).
- **Un chiffre que je n'ai pas pu vérifier** : la valeur du tableau 4 de l'article sur le Burkina Faso (question 3.4 c). ChatGPT donne 0,396 ; Claude dit ne pas avoir pu lire le tableau. Tu dois la lire toi-même dans ta copie de l'article.
- **Un piège technique** : les deux scripts échouent dès la lecture des fichiers si la session R n'est pas en UTF-8. Détails dans l'atelier R.
:::

## La consigne du cours

:::note À garder en tête
L'énoncé précise que l'usage d'outils d'intelligence artificielle n'est pas autorisé pour ce travail, que chaque membre du groupe doit pouvoir expliquer le code et l'ensemble du travail, et qu'un examen oral par groupe suit la remise. Cet atelier est construit pour que tu comprennes la matière et puisses tout refaire et tout expliquer toi-même. Ce que tu remets reste ta décision et ta responsabilité.
:::
